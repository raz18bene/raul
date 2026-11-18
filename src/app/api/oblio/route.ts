export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { issueOblioDocument } from '@/lib/oblio'
import { apiError, ApiError, jsonBody, requireAdmin, UUID } from '@/lib/api-security'
import { storedOrderTotal } from '@/lib/checkout'
import { standardVat } from '@/lib/vat'
import { readAllPages } from '@/lib/catalog-pagination'
import { oblioClient, stockDocument } from '@/lib/oblio-stock'

async function getOblioToken() {
  const body = new URLSearchParams({
    client_id: process.env.OBLIO_CLIENT_ID!,
    client_secret: process.env.OBLIO_CLIENT_SECRET!,
    grant_type: 'client_credentials',
  })
  const r = await fetch('https://www.oblio.eu/api/authorize/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!r.ok) throw new Error('Oblio auth failed: ' + r.status)
  const d = await r.json()
  if (!d.access_token) throw new Error('No access_token from Oblio')
  return d.access_token as string
}


export async function POST(req: Request) {
  try {
    const { action, ...body } = await jsonBody(req)
    await requireAdmin(req, body.accessToken)
    if (action === 'sync-stock') return await syncStock()
    if (action === 'create-invoice') {
      if (typeof body.orderId !== 'string' || !UUID.test(body.orderId)) throw new ApiError(400, 'ID invalid.')
      const result = await issueOblioDocument('invoice', body.orderId)
      if (!result.success) return NextResponse.json(result, { status: result.status || 400 })
      return NextResponse.json({ success: true, invoice: result.doc, alreadyIssued: !!result.alreadyIssued })
    }
    if (action !== 'decrease-stock') throw new ApiError(400, 'Acțiune necunoscută.')
    if (stockDocument() !== 'notice') throw new ApiError(409, 'Stocul se descarcă prin factură. Avizul separat este dezactivat pentru a evita dublarea.')
    if (typeof body.orderId !== 'string' || !UUID.test(body.orderId)) throw new ApiError(400, 'ID invalid.')
    const sb = createServiceClient()
    const { data: order, error } = await sb.from('orders').select('*, order_items(*)').eq('id', body.orderId).single()
    if (error || !order || order.status === 'cancelled' || (order.payment_method === 'card' && order.payment_status !== 'paid')) throw new ApiError(409, 'Comanda nu permite scăderea stocului.')
    const amount = storedOrderTotal(order)
    const { data: trusted, error: securityError } = await sb.from('order_security').select('amount_cents').eq('order_id', order.id).maybeSingle()
    if (securityError || !trusted || Number(trusted.amount_cents) !== amount) throw new ApiError(409, 'Comanda necesită verificare manuală.')
    const { data: products, error: productsError } = await sb.from('products').select('id,sku').in('id', order.order_items.map((i: any) => i.product_id))
    if (productsError) throw productsError
    const vat = standardVat()
    const { error: claimError } = await sb.from('oblio_operations').insert({ order_id: order.id, kind: 'notice', state: 'pending' })
    if (claimError) throw new ApiError(409, 'Operația există deja sau necesită reconciliere. Nu se retrimite automat.')
    const token = await getOblioToken()
    const payload = {
      cif: process.env.OBLIO_CIF, seriesName: process.env.OBLIO_SERIES || 'STOC',
      client: oblioClient(order), currency: 'RON', useStock: 1, idempotencyKey: `technest-notice-${order.id}`,
      ...(process.env.OBLIO_WORK_STATION ? { workStation: process.env.OBLIO_WORK_STATION } : {}),
      issueDate: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], orderNumber: order.order_number,
      products: order.order_items.map((i: any) => ({ name: i.product_name, code: products?.find(p => p.id === i.product_id)?.sku || '',
        measuringUnit: 'buc', quantity: i.quantity, price: Number(i.unit_price), currency: 'RON', productType: 'Marfa',
        ...(process.env.OBLIO_MANAGEMENT ? { management: process.env.OBLIO_MANAGEMENT } : {}), ...vat })),
    }
    const response = await fetch('https://www.oblio.eu/api/docs/notice', { method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await response.json()
    if (!response.ok || !data?.data?.number) throw new ApiError(502, 'Oblio nu a confirmat documentul. Verifică înainte de reîncercare.')
    const saved = await sb.from('oblio_operations').update({ state: 'completed', result: data }).eq('order_id', order.id).eq('kind', 'notice')
    if (saved.error) throw new ApiError(503, 'Document emis; reconcilierea locală este necesară.')
    return NextResponse.json({ success: true, ...data })
  } catch (error) { return apiError(error) }
}
export async function GET(req: Request) {
  try {
    await requireAdmin(req)
    const action = new URL(req.url).searchParams.get('action')
    if (action === 'sync-stock') return NextResponse.json({ error: 'Folosește POST.' }, { status: 405 })
    if (action !== 'test') throw new ApiError(400, 'Acțiune necunoscută.')
    await getOblioToken()
    return NextResponse.json({ ok: true, message: 'Oblio disponibil' })
  } catch (error) { return apiError(error) }
}
async function syncStock() {

    try {
      const token = await getOblioToken()
      const cif = process.env.OBLIO_CIF!
      let allProducts: any[] = []
      let offset = 0
      while (true) {
        const r = await fetch(`https://www.oblio.eu/api/nomenclature/products?cif=${encodeURIComponent(cif)}&limitPerPage=250&offset=${offset}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        })
        const rawText = await r.text()
        let pageData: any
        try { pageData = JSON.parse(rawText) } catch { return NextResponse.json({ error: 'Oblio invalid JSON', raw: rawText.slice(0, 300) }, { status: 400 }) }
        if (!r.ok || !pageData.data) return NextResponse.json({ error: 'Oblio error', details: pageData }, { status: 400 })
        allProducts = [...allProducts, ...pageData.data]
        if (pageData.data.length < 250) break
        offset += 250
      }

      const supabase = createServiceClient()
      const dbProducts = await readAllPages<any>((from, to) => supabase.from('products').select('id, sku, name, stock').order('id').range(from, to))
      if (!dbProducts) return NextResponse.json({ error: 'Supabase error' }, { status: 500 })

      const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
      const updated: any[] = []
      const notFound: any[] = []
      const usedIds = new Set<string>()
      const pending: any[] = []

      for (const op of allProducts) {
        const code = (op.code || '').trim()
        const stock = Array.isArray(op.stock) ? op.stock.reduce((s: number, x: any) => s + (parseFloat(x.quantity) || 0), 0) : 0
        let match = null, matchedBy = ''
        if (code) { match = dbProducts.find(p => !usedIds.has(p.id) && (p.sku || '').trim() === code); if (match) matchedBy = 'sku' }
        if (!match) { const n = normalize(op.name); match = dbProducts.find(p => !usedIds.has(p.id) && normalize(p.name) === n); if (match) matchedBy = 'name' }
        if (!match) { notFound.push({ code, name: op.name, stock }); continue }
        usedIds.add(match.id)
        const updates: any = {}
        if (match.stock !== stock) updates.stock = stock
        if (matchedBy === 'name' && code && !(match.sku || '').trim()) updates.sku = code
        if (Object.keys(updates).length > 0) pending.push({ id: match.id, updates, info: { name: match.name, matchedBy, oldStock: match.stock, newStock: stock, skuSet: updates.sku || null } })
      }

      let failures = 0
      const BATCH = 20
      for (let i = 0; i < pending.length; i += BATCH) {
        const batch = pending.slice(i, i + BATCH)
        const results = await Promise.all(batch.map(item => supabase.from('products').update(item.updates).eq('id', item.id).then(({ error }) => ({ error, info: item.info }))))
        results.forEach(({ error, info }) => { if (!error) updated.push(info); else failures++ })
      }

      return NextResponse.json({ success: failures === 0, failed_count: failures, updated_count: updated.length, updated, not_found: notFound, total_oblio: allProducts.length })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }
