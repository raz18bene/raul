export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    return await handleCreateCheckoutSession(req)
  } catch (e: any) {
    // Plasa de siguranta: orice eroare neasteptata tot trebuie sa iasa ca JSON valid —
    // altfel checkout-ul crapa la res.json() cu "Unexpected end of JSON input", chiar
    // daca intre timp comanda a fost deja creata cu succes in baza de date.
    console.error('Eroare neasteptata in /api/stripe:', e)
    return NextResponse.json({ success: false, error: 'A apărut o eroare neașteptată la inițierea plății. Comanda ta a fost înregistrată — te rugăm să reîncerci plata sau să ne contactezi.' }, { status: 500 })
  }
}

async function handleCreateCheckoutSession(req: Request) {
  let orderData: any
  try {
    orderData = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Cerere invalidă (fără date de comandă).' }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ success: false, error: 'Stripe nu este configurat (lipsește STRIPE_SECRET_KEY).' }, { status: 500 })
  }

  const host = req.headers.get('host') || ''
  const proto = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`

  const items = (orderData.items || []) as { name: string, price: number, quantity: number }[]
  if (!items.length) {
    return NextResponse.json({ success: false, error: 'Coșul este gol.' }, { status: 400 })
  }

  const line_items: any[] = items.map(i => ({
    price_data: {
      currency: 'ron',
      product_data: { name: i.name },
      unit_amount: Math.round((i.price || 0) * 100), // Stripe vrea suma in bani (RON are 2 zecimale), nu in lei
    },
    quantity: i.quantity || 1,
  }))

  const shippingCost = Number(orderData.shippingCost) || 0
  if (shippingCost > 0) {
    line_items.push({
      price_data: {
        currency: 'ron',
        product_data: { name: 'Transport' },
        unit_amount: Math.round(shippingCost * 100),
      },
      quantity: 1,
    })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      client_reference_id: orderData.orderNumber,
      customer_email: orderData.customerEmail || undefined,
      metadata: {
        orderNumber: orderData.orderNumber || '',
        customerName: orderData.customerName || '',
        customerPhone: orderData.customerPhone || '',
      },
      success_url: `${baseUrl}/payment-return?order=${encodeURIComponent(orderData.orderNumber || '')}&method=card`,
      cancel_url: `${baseUrl}/checkout?stripe_cancelled=1`,
    })

    return NextResponse.json({ success: true, url: session.url })
  } catch (e: any) {
    console.error('Eroare Stripe la crearea sesiunii de checkout:', e)
    return NextResponse.json({ success: false, error: 'Nu s-a putut iniția plata cu cardul (Stripe). Comanda a fost înregistrată — încearcă din nou sau alege altă metodă de plată.' }, { status: 502 })
  }
}
