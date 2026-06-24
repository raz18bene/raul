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

export async function POST(req: Request) {
  const { action, ...body } = await req.json()

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
