export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'

// Stripe trimite aici o notificare ori de cate ori se intampla ceva cu o plata
// (confirmata, esuata, expirata). Trebuie configurat manual in Dashboard-ul Stripe:
// Developers -> Webhooks -> Add endpoint -> https://<domeniul-tau>/api/stripe/webhook
// evenimente: checkout.session.completed, checkout.session.expired,
// payment_intent.payment_failed. Secretul de semnare generat acolo merge in
// variabila de mediu STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET nu este setat — webhook-ul Stripe nu poate fi verificat.')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // IMPORTANT: semnatura Stripe se verifica pe body-ul brut (text), nu pe JSON parsat.
  const rawBody = await req.text()

  let event: any
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error('Semnatura webhook Stripe invalidă:', err.message)
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object
      const orderNumber = session.client_reference_id || session.metadata?.orderNumber
      if (orderNumber) {
        await supabase.from('orders')
          .update({ payment_status: 'paid', status: 'processing', updated_at: new Date().toISOString() })
          .eq('order_number', orderNumber)
      }
    } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed' || event.type === 'payment_intent.payment_failed') {
      const obj = event.data.object
      const orderNumber = obj.client_reference_id || obj.metadata?.orderNumber
      if (orderNumber) {
        await supabase.from('orders')
          .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
          .eq('order_number', orderNumber)
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('Eroare la procesarea evenimentului Stripe:', e)
    // Raspundem tot 200 catre Stripe ca sa nu retrimita la infinit un eveniment pe care
    // oricum nu-l putem procesa diferit — eroarea reala ramane in loguri pentru investigat.
    return NextResponse.json({ received: true, warning: 'processing error logged' })
  }
}
