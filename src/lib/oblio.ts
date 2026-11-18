import { createServiceClient } from '@/lib/supabase'
import { standardVat } from './vat'
import { storedOrderTotal } from './checkout'
import { oblioClient, stockDocument } from './oblio-stock'

// Emite un document Oblio (factura sau proforma) din datele unei comenzi.
// Folosit de panoul de admin (factura, la generarea AWB) si de crearea comenzii (proforma pentru persoane juridice).
export type OblioDocKind = 'invoice' | 'proforma'

async function getToken() {
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
  if (!r.ok) throw new Error('Autentificare Oblio eșuată (' + r.status + '). Verifică OBLIO_CLIENT_ID / OBLIO_CLIENT_SECRET.')
  const d = await r.json()
  if (!d.access_token) throw new Error('Oblio nu a returnat token.')
  return d.access_token as string
}

export type OblioDocResult =
  | { success: true; doc: { series: string; number: string | number; link: string | null; issuedAt: string }; alreadyIssued?: boolean }
  | { success: false; error: string; status?: number; details?: any }

export async function issueOblioDocument(kind: OblioDocKind, orderId: string): Promise<OblioDocResult> {
  try {
    const supabase = createServiceClient()
    const { data: order, error: oErr } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single()
    if (oErr || !order) return { success: false, error: 'Comanda nu a fost găsită.', status: 404 }

    if (order.status === 'cancelled' || (kind === 'invoice' && order.payment_method === 'card' && order.payment_status !== 'paid')) return { success: false, error: 'Comanda nu permite emiterea.', status: 409 }
    const { data: trusted } = await supabase.from('order_security').select('amount_cents').eq('order_id', order.id).maybeSingle()
    if (!trusted || Number(trusted.amount_cents) !== storedOrderTotal(order)) return { success: false, error: 'Comanda necesită verificare manuală.', status: 409 }

    const column = kind === 'invoice' ? 'invoice' : 'proforma'
    const existing = (order as any)[column]
    // Nu emitem a doua oara acelasi document pentru aceeasi comanda
    if (existing?.number) return { success: true, doc: existing, alreadyIssued: true }

    const series = kind === 'invoice'
      ? process.env.OBLIO_INVOICE_SERIES
      : (process.env.OBLIO_PROFORMA_SERIES || process.env.OBLIO_INVOICE_SERIES)
    if (!series || !process.env.OBLIO_CIF) {
      const lipsa = !series ? (kind === 'invoice' ? 'OBLIO_INVOICE_SERIES (seria de facturi din Oblio, ex. AAA)' : 'OBLIO_PROFORMA_SERIES sau OBLIO_INVOICE_SERIES') : 'OBLIO_CIF'
      return { success: false, error: 'Configurare Oblio incompletă în Vercel: lipsește ' + lipsa + '.', status: 400 }
    }
    const { vatName, vatPercentage } = standardVat()

    // Coduri produs (SKU) din catalog, ca sa se potriveasca cu stocul din Oblio
    const ids = (order.order_items || []).map((i: any) => i.product_id).filter(Boolean)
    const skuById: Record<string, string> = {}
    if (ids.length) {
      const { data: prods, error: productsError } = await supabase.from('products').select('id, sku').in('id', ids)
      if (productsError) throw productsError
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
      ...(process.env.OBLIO_MANAGEMENT ? { management: process.env.OBLIO_MANAGEMENT } : {}),
    }))
    const shippingCost = Number(order.shipping_cost) || 0
    if (shippingCost > 0) {
      products.push({
        name: 'Transport', code: '', measuringUnit: 'buc', currency: 'RON',
        vatName, vatPercentage, vatIncluded: true, quantity: 1, price: shippingCost, productType: 'Serviciu',
      })
    }
    if (!products.length) return { success: false, error: 'Comanda nu are produse.', status: 400 }

    // Clientul: persoana juridica (cu CUI, Reg. Com.) sau fizica, din datele de facturare ale comenzii
    const client = oblioClient(order)

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
      ...(kind === 'invoice' ? { useStock: stockDocument() === 'invoice' ? 1 : 0 } : {}),
      ...(process.env.OBLIO_WORK_STATION ? { workStation: process.env.OBLIO_WORK_STATION } : {}),
      idempotencyKey: `technest-${kind}-${order.id}`,
      // Oblio trimite documentul (PDF) pe emailul clientului, direct din contul vostru Oblio
      sendEmail: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(order.customer_email || '')) ? 1 : 0,
      mentions: `Comanda ${order.order_number}`,
      internalNote: `Comanda site ${order.order_number}`,
    }

    const claim = await supabase.from('oblio_operations').insert({ order_id: order.id, kind, state: 'pending' })
    if (claim.error) return { success: false, error: 'Operație deja pornită; verifică documentul în Oblio înainte de reîncercare.', status: 409 }
    const token = await getToken()
    const r = await fetch(`https://www.oblio.eu/api/docs/${kind}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const text = await r.text()
    let d: any = null
    try { d = JSON.parse(text) } catch { /* raspuns non-JSON */ }
    if (!r.ok || !d?.data?.number) {
      const msg = d?.statusMessage || d?.message || text.slice(0, 300) || 'Răspuns necunoscut de la Oblio.'
      return { success: false, error: `Oblio a refuzat ${kind === 'invoice' ? 'factura' : 'proforma'}: ` + msg, status: 400, details: d }
    }
    const doc = { series: d.data.seriesName || series, number: d.data.number, link: d.data.link || null, issuedAt: new Date().toISOString() }
    const saved = await supabase.from('orders').update({ [column]: doc } as any).eq('id', order.id)
    if (saved.error) return { success: false, error: 'Document emis; salvarea locală necesită reconciliere.', status: 503 }
    const operation = await supabase.from('oblio_operations').update({ state: 'completed', result: doc }).eq('order_id', order.id).eq('kind', kind)
    if (operation.error) console.warn('Oblio document saved; operation journal requires reconciliation')
    return { success: true, doc }
  } catch (e: any) {
    return { success: false, error: e.message || 'Eroare la emiterea documentului.', status: 500 }
  }
}
