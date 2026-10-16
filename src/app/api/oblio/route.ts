export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

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

// Doar adminul poate emite facturi (token-ul sesiunii vine din panoul de admin)
async function requireAdmin(token: unknown): Promise<boolean> {
  if (!token || typeof token !== 'string') return false
  try {
    const { data, error } = await createServiceClient().auth.getUser(token)
    if (error || !data?.user) return false
    return (data.user.app_metadata as any)?.role === 'admin'
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const { action, ...body } = await req.json()

  // ── Factura din comanda: citim comanda din baza de date (nu ne bazam pe sume trimise din browser) ──
  if (action === 'create-invoice') {
    if (!(await requireAdmin(body.accessToken))) {
      return NextResponse.json({ success: false, error: 'Neautorizat — autentifică-te ca admin.' }, { status: 401 })
    }
    try {
      const supabase = createServiceClient()
      const { data: order, error: oErr } = await supabase.from('orders').select('*, order_items(*)').eq('id', body.orderId).single()
      if (oErr || !order) return NextResponse.json({ success: false, error: 'Comanda nu a fost găsită.' }, { status: 404 })

      // Nu emitem a doua factura pentru aceeasi comanda
      if (order.invoice?.number) {
        return NextResponse.json({ success: true, alreadyIssued: true, invoice: order.invoice })
      }

      const series = process.env.OBLIO_INVOICE_SERIES
      if (!series || !process.env.OBLIO_CIF) {
        return NextResponse.json({ success: false, error: 'Configurare Oblio incompletă în Vercel: lipsește ' + (!series ? 'OBLIO_INVOICE_SERIES (seria de facturi din Oblio, ex. TN)' : 'OBLIO_CIF') + '.' }, { status: 400 })
      }
      const vatName = process.env.OBLIO_VAT_NAME || 'Normala'
      const vatPercentage = Number(process.env.OBLIO_VAT_PERCENTAGE ?? 21)

      // Coduri produs (SKU) din catalog, ca sa se potriveasca cu stocul din Oblio
      const ids = (order.order_items || []).map((i: any) => i.product_id).filter(Boolean)
      const skuById: Record<string, string> = {}
      if (ids.length) {
        const { data: prods } = await supabase.from('products').select('id, sku').in('id', ids)
        for (const p of prods || []) skuById[p.id] = p.sku || ''
      }

      const products: any[] = (order.order_items || []).map((i: any) => ({
        name: i.product_name,
        code: skuById[i.product_id] || '',
        measuringUnit: 'buc',
        currency: 'RON',
        vatName, vatPercentage, vatIncluded: true,
        quantity: Number(i.quantity),
        price: Number(i.unit_price),
        productType: 'Marfa',
      }))
      const shippingCost = Number(order.shipping_cost) || 0
      if (shippingCost > 0) {
        products.push({
          name: 'Transport', code: '', measuringUnit: 'buc', currency: 'RON',
          vatName, vatPercentage, vatIncluded: true, quantity: 1, price: shippingCost, productType: 'Serviciu',
        })
      }
      if (!products.length) return NextResponse.json({ success: false, error: 'Comanda nu are produse.' }, { status: 400 })

      // Clientul: persoana juridica (cu CUI, Reg. Com.) sau fizica, din datele de facturare ale comenzii
      const b = order.billing || {}
      const ship = order.shipping_address || {}
      const client: any = b.type === 'pj'
        ? { cif: b.cui, name: b.company, rc: b.regCom, address: b.address, state: b.county, city: b.city, country: 'Romania', email: order.customer_email, phone: order.customer_phone, vatPayer: !!b.vatPayer || /^RO/i.test(String(b.cui || '')) }
        : {
            name: b.name || order.customer_name,
            address: (b.sameAsDelivery === false ? b.address : ship.street) || ship.street || '',
            state: (b.sameAsDelivery === false ? b.county : ship.county) || ship.county || '',
            city: (b.sameAsDelivery === false ? b.city : ship.city) || ship.city || '',
            country: 'Romania', email: order.customer_email, phone: order.customer_phone, vatPayer: false,
          }

      const today = new Date().toISOString().split('T')[0]
      const payload = {
        cif: process.env.OBLIO_CIF,
        client,
        issueDate: today,
        dueDate: today,
        deliveryDate: today,
        seriesName: series,
        language: 'RO',
        precision: 2,
        currency: 'RON',
        products,
        mentions: `Comanda ${order.order_number}`,
        internalNote: `Comanda site ${order.order_number}`,
      }

      const token = await getOblioToken()
      const r = await fetch('https://www.oblio.eu/api/docs/invoice', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const text = await r.text()
      let d: any = null
      try { d = JSON.parse(text) } catch { /* raspuns non-JSON */ }
      if (!r.ok || !d?.data?.number) {
        const msg = d?.statusMessage || d?.message || text.slice(0, 300) || 'Răspuns necunoscut de la Oblio.'
        return NextResponse.json({ success: false, error: 'Oblio a refuzat factura: ' + msg, details: d }, { status: 400 })
      }
      const invoice = { series: d.data.seriesName || series, number: d.data.number, link: d.data.link || null, issuedAt: new Date().toISOString() }
      await supabase.from('orders').update({ invoice }).eq('id', order.id)
      return NextResponse.json({ success: true, invoice })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message || 'Eroare la emiterea facturii.' }, { status: 500 })
    }
  }

  if (action === 'decrease-stock') {
    try {
      const token = await getOblioToken()
      const payload = {
        cif: process.env.OBLIO_CIF,
        seriesName: process.env.OBLIO_SERIES || 'STOC',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        reference: body.orderNumber || '',
        products: (body.items || []).map((i: any) => ({
          name: i.name, code: i.code || '',
          measuringUnit: 'buc', quantity: i.quantity,
          price: i.price || 0, vatName: 'Normala',
          vatPercentage: 19, vatIncluded: true,
        })),
      }
      const r = await fetch('https://www.oblio.eu/api/docs/notice', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (!r.ok) return NextResponse.json({ error: 'Oblio error', details: d }, { status: 400 })
      return NextResponse.json({ success: true, ...d })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'test') {
    try {
      await getOblioToken()
      return NextResponse.json({ ok: true, message: 'Oblio ✅' })
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message })
    }
  }

  if (action === 'sync-stock') {
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
      const { data: dbProducts } = await supabase.from('products').select('id, sku, name, stock')
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

      const BATCH = 20
      for (let i = 0; i < pending.length; i += BATCH) {
        const batch = pending.slice(i, i + BATCH)
        const results = await Promise.all(batch.map(item => supabase.from('products').update(item.updates).eq('id', item.id).then(({ error }) => ({ error, info: item.info }))))
        results.forEach(({ error, info }) => { if (!error) updated.push(info) })
      }

      return NextResponse.json({ success: true, updated_count: updated.length, updated, not_found: notFound, total_oblio: allProducts.length })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
