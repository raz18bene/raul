export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = createServiceClient()

  const orderNumber = 'ORD-' + Date.now()

  const { data: order, error } = await supabase.from('orders').insert({
    order_number: orderNumber,
    customer_name: body.customerName,
    customer_email: body.customerEmail,
    customer_phone: body.customerPhone,
    shipping_address: {
      street: body.address,
      city: body.city,
      county: body.county,
      postal_code: body.postalCode,
    },
    total_amount: body.total,
    status: 'pending',
    payment_status: 'pending',
    payment_method: body.paymentMethod,
    shipping_method: body.shippingMethod,
    shipping_cost: body.shippingCost,
    notes: body.notes,
  }).select().single()

  if (error || !order) return NextResponse.json({ error: 'Order creation failed', details: error }, { status: 500 })

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
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#0a0e27;padding:24px;border-radius:12px 12px 0 0;"><h1 style="color:#00d9ff;font-family:monospace;margin:0;">Tech<span style="color:#ff6b35;">Nest</span></h1></div><div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;"><h2 style="color:#1a202c;">✅ Comanda ta a fost primită!</h2><p style="color:#4a5568;">Număr comandă: <strong style="color:#00a8cc;">${orderNumber}</strong></p><p style="color:#4a5568;">Total: <strong>${body.total} RON</strong></p><p style="color:#4a5568;">Metodă livrare: ${body.shippingMethod === 'sediu' ? 'Ridicare de la sediu' : 'SameDay Courier'}</p><p style="color:#718096;font-size:0.85rem;">Te vom contacta în curând cu detalii despre livrare.</p><hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;"/><p style="color:#a0aec0;font-size:0.78rem;">TechNest Prototyping SRL · technest.prototyping@gmail.com · 0754 545 800</p></div></div>`,
        }),
      })
    } catch (e) { console.warn('Resend order email failed:', e) }
  }

  return NextResponse.json({ success: true, orderId: order.id, orderNumber })
}

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
