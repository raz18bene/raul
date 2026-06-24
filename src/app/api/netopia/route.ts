import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const orderData = await req.json()

  const signature   = process.env.NETOPIA_SIGNATURE!
  const publicKey   = process.env.NETOPIA_PUBLIC_KEY!

  if (!signature || !publicKey) {
    return NextResponse.json({ error: 'Netopia not configured' }, { status: 500 })
  }

  const host = req.headers.get('host') || ''
  const proto = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`

  const payload = {
    config: {
      emailTemplate: 'confirm',
      notifyUrl: `${baseUrl}/api/netopia/callback`,
      redirectUrl: `${baseUrl}/payment-return?order=${orderData.orderNumber}`,
      language: 'ro',
    },
    payment: {
      options: { installments: 1, bonus: 0 },
      instrument: { type: 'card', account: '', expMonth: '', expYear: '', secretCode: '', token: '' },
    },
    order: {
      ntpID: null,
      posSignature: signature,
      dateTime: new Date().toISOString(),
      description: `Comanda ${orderData.orderNumber} - TechNest`,
      orderID: orderData.orderNumber,
      amount: parseFloat(orderData.total),
      currency: 'RON',
      billing: {
        email: orderData.customerEmail,
        phone: orderData.customerPhone || '',
        firstName: orderData.customerName?.split(' ')[0] || '',
        lastName: orderData.customerName?.split(' ').slice(1).join(' ') || '',
        city: orderData.city || '',
        country: 642,
        state: orderData.county || '',
        postalCode: orderData.postalCode || '',
        details: orderData.address || '',
      },
      shipping: {
        email: orderData.customerEmail,
        phone: orderData.customerPhone || '',
        firstName: orderData.customerName?.split(' ')[0] || '',
        lastName: orderData.customerName?.split(' ').slice(1).join(' ') || '',
        city: orderData.city || '',
        country: 642,
        state: orderData.county || '',
        postalCode: orderData.postalCode || '',
        details: orderData.address || '',
      },
      products: orderData.items || [],
      installments: { selected: 1, available: [1] },
    },
  }

  const r = await fetch('https://secure.netopia-payments.com/payment/card/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': publicKey },
    body: JSON.stringify(payload),
  })

  const d = await r.json()
  if (!r.ok || !d?.payment?.paymentURL) {
    return NextResponse.json({ error: 'Netopia failed', details: d }, { status: 502 })
  }

  return NextResponse.json({ success: true, paymentUrl: d.payment.paymentURL })
}
