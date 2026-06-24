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
