export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase'
import { apiError, ApiError } from '@/lib/api-security'
import { validateStripeSession, recordPayment } from '@/lib/payments'

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  if (!process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: 'Webhook unavailable' }, { status: 503 })
  let event
  try { event = getStripe().webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET) }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }) }
  const types = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired', 'checkout.session.async_payment_failed']
  if (!types.includes(event.type)) return NextResponse.json({ received: true })
  try {
    const source = event.data.object as { id: string }
    const session = await getStripe().checkout.sessions.retrieve(source.id)
    const sb = createServiceClient()
    const { data: attempt, error } = await sb.from('payment_attempts').select('*').eq('provider', 'stripe').eq('provider_id', session.id).maybeSingle()
    if (error || !attempt) throw new ApiError(503, 'Payment registration not ready')
    const result = await sb.from('orders').select('*, order_items(*)').eq('id', attempt.order_id).single()
    if (result.error || !result.data) throw new ApiError(503, 'Order unavailable')
    validateStripeSession(session, attempt, result.data, /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? ''))
    if (session.payment_status === 'paid') await recordPayment(attempt, session.id, event.id, true)
    else if (event.type === 'checkout.session.expired' && session.status === 'expired') await recordPayment(attempt, session.id, event.id, false)
    else if (event.type === 'checkout.session.async_payment_failed') await recordPayment(attempt, session.id, event.id, false)
    return NextResponse.json({ received: true })
  } catch (error) { return apiError(error) } // Retry on database/provider failure, never falsely acknowledge success.
}
