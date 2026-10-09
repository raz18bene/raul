export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    return await handleCreateOrder(req)
  } catch (e: any) {
    // Plasa de siguranta: orice eroare neasteptata tot trebuie sa iasa ca JSON valid,
    // altfel checkout-ul crapa la res.json() cu "Unexpected end of JSON input".
    console.error('Eroare neasteptata in POST /api/orders:', e)
    return NextResponse.json({ success: false, error: 'A apărut o eroare neașteptată la înregistrarea comenzii. Te rugăm să reîncerci.' }, { status: 500 })
  }
}

async function handleCreateOrder(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Date de comandă invalide.' }, { status: 400 })
  }
  const supabase = createServiceClient()

  // Daca clientul e autentificat, a trimis un accessToken — il verificam noi insine pe server
  // (nu avem incredere intr-un userId trimis simplu din browser, oricine ar putea pretinde
  // ca e altcineva). Daca token-ul lipseste sau nu e valid, comanda continua ca "guest",
  // exact ca inainte — nu blocam checkout-ul din cauza asta.
  let userId: string | null = null
  if (body.accessToken) {
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser(body.accessToken)
      if (!userErr && userData?.user) userId = userData.user.id
    } catch (e) { console.warn('Nu am putut verifica accessToken-ul (comanda continuă ca guest):', e) }
  }

  // Livrare in easybox: validam ce a trimis clientul (id numeric + nume + oras) si
  // folosim adresa easybox-ului ca adresa de livrare.
  let locker: any = null
  const l = body.locker
  if (body.shippingMethod === 'easybox') {
    if (!l || !Number.isFinite(Number(l.id)) || !l.name || !l.city) {
      return NextResponse.json({ success: false, error: 'Alege un easybox pentru livrare.' }, { status: 400 })
    }
    locker = {
      id: Number(l.id),
      name: String(l.name).slice(0, 200),
      address: String(l.address || '').slice(0, 300),
      city: String(l.city).slice(0, 100),
      county: String(l.county || '').slice(0, 100),
      postalCode: String(l.postalCode || '').slice(0, 20),
      lat: Number(l.lat) || undefined,
      lng: Number(l.lng) || undefined,
    }
  }

  // Facturare: persoana fizica sau juridica. La PJ campurile sunt obligatorii (validate si pe server).
  const b = body.billing || {}
  const clip = (v: any, n = 200) => String(v ?? '').trim().slice(0, n)
  let billing: any
  if (b.type === 'pj') {
    billing = {
      type: 'pj', company: clip(b.company), cui: clip(b.cui, 20).toUpperCase().replace(/\s/g, ''), regCom: clip(b.regCom, 40),
      address: clip(b.address, 300), city: clip(b.city, 100), county: clip(b.county, 100), postalCode: clip(b.postalCode, 20), vatPayer: b.vatPayer === true,
    }
    if (!billing.company || !billing.regCom || !billing.address || !billing.city || !billing.county || !/^(RO)?\d{2,10}$/.test(billing.cui)) {
      return NextResponse.json({ success: false, error: 'Date de facturare incomplete pentru persoană juridică (denumire, CUI valid, Reg. Com., adresă, oraș, județ).' }, { status: 400 })
    }
  } else {
    billing = { type: 'pf', name: clip(b.name) || clip(body.customerName), sameAsDelivery: b.sameAsDelivery !== false && !locker }
    if (!billing.sameAsDelivery) {
      Object.assign(billing, { address: clip(b.address, 300), city: clip(b.city, 100), county: clip(b.county, 100), postalCode: clip(b.postalCode, 20) })
    }
    if (!billing.sameAsDelivery && (!b.address || !b.city || !b.county)) {
      return NextResponse.json({ success: false, error: 'Completează adresa de facturare.' }, { status: 400 })
    }
  }

  const orderNumber = 'ORD-' + Date.now()

  const { data: order, error } = await supabase.from('orders').insert({
    order_number: orderNumber,
    user_id: userId,
    billing,
    customer_name: body.customerName,
    customer_email: body.customerEmail,
    customer_phone: body.customerPhone,
    shipping_address: locker
      ? { street: locker.address, city: locker.city, county: locker.county, postal_code: locker.postalCode, locker }
      : { street: body.address, city: body.city, county: body.county, postal_code: body.postalCode },
    total_amount: body.total,
    status: 'pending',
    payment_status: 'pending',
    payment_method: body.paymentMethod,
    shipping_method: body.shippingMethod,
    shipping_cost: body.shippingCost,
    notes: body.notes,
  }).select().single()

  if (error || !order) return NextResponse.json({ success: false, error: 'Order creation failed', details: error }, { status: 500 })

  // Daca era autentificat, ii actualizam si profilul salvat cu datele de livrare
  // folosite acum, ca sa fie gata preumplute si data viitoare (best-effort, nu blocam comanda).
  if (userId) {
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: body.customerName,
        phone: body.customerPhone,
        address: body.address,
        city: body.city,
        county: body.county,
        postal_code: body.postalCode,
        updated_at: new Date().toISOString(),
      })
    } catch (e) { console.warn('Actualizare profil eșuată (non-fatal):', e) }
  }

  // Insert order items
  const items = (body.items || []).map((i: any) => ({
    order_id: order.id,
    product_id: i.id,
    product_name: i.name,
    quantity: i.quantity,
    unit_price: i.price,
    total_price: i.price * i.quantity,
  }))
  await supabase.from('order_items').insert(items)

  // Decrease stock in Oblio (non-blocking)
  try {
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/oblio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'decrease-stock',
        orderNumber,
        items: (body.items || []).map((i: any) => ({ name: i.name, code: i.sku || '', quantity: i.quantity, price: i.price })),
      }),
    })
  } catch (e) { console.warn('Oblio decrease-stock failed (non-fatal):', e) }

  // Send order confirmation email via Resend
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TechNest <onboarding@resend.dev>',
          to: [body.customerEmail, 'technest.prototyping@gmail.com'],
          reply_to: 'technest.prototyping@gmail.com',
          subject: `Comandă confirmată — ${orderNumber}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#0a0e27;padding:24px;border-radius:12px 12px 0 0;"><h1 style="color:#00d9ff;font-family:monospace;margin:0;">Tech<span style="color:#ff6b35;">Nest</span></h1></div><div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;"><h2 style="color:#1a202c;">✅ Comanda ta a fost primită!</h2><p style="color:#4a5568;">Număr comandă: <strong style="color:#00a8cc;">${orderNumber}</strong></p><p style="color:#4a5568;">Total: <strong>${body.total} RON</strong></p><p style="color:#4a5568;">Metodă livrare: ${body.shippingMethod === 'sediu' ? 'Ridicare de la sediu' : locker ? 'Easybox SameDay — ' + locker.name + ', ' + locker.address + ', ' + locker.city : 'SameDay Courier'}</p><p style="color:#718096;font-size:0.85rem;">Te vom contacta în curând cu detalii despre livrare.</p><hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;"/><p style="color:#a0aec0;font-size:0.78rem;">TechNest Prototyping SRL · technest.prototyping@gmail.com · 0754 545 800</p></div></div>`,
        }),
      })
    } catch (e) { console.warn('Resend order email failed:', e) }
  }

  return NextResponse.json({ success: true, orderId: order.id, orderNumber })
}

// GET eliminat intentionat: returna public TOATE comenzile (nume, telefon, adrese). Adminul le citeste direct din Supabase, cu sesiunea lui.
