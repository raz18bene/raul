export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { SITE_URL } from '@/lib/site'
import { apiError, ApiError, jsonBody } from '@/lib/api-security'
import { money } from '@/lib/checkout'
import { payableOrder, paymentAttempt, validateStripeSession } from '@/lib/payments'

export async function POST(req: Request) {
  try {
    const { sb, order, amount } = await payableOrder(req, await jsonBody(req))
    const attempt = await paymentAttempt(sb, order.id, 'stripe', amount)
    const stripe = getStripe()
    if (attempt.provider_id) {
      const existing = await stripe.checkout.sessions.retrieve(attempt.provider_id)
      validateStripeSession(existing, attempt, order, /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? ''))
      if (existing.status !== 'open' || !existing.url) throw new ApiError(409, 'Sesiunea existentă nu mai permite plata.')
      return NextResponse.json({ success: true, url: existing.url }, { headers: { 'Cache-Control': 'no-store' } })
    }
    const line_items = order.order_items.map((i: any) => ({
      price_data: { currency: 'ron', product_data: { name: i.product_name }, unit_amount: money(i.unit_price) }, quantity: i.quantity,
    }))
    if (money(order.shipping_cost)) line_items.push({ price_data: { currency: 'ron', product_data: { name: 'Transport' }, unit_amount: money(order.shipping_cost) }, quantity: 1 })
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', payment_method_types: ['card'], line_items,
      client_reference_id: order.order_number, customer_email: order.customer_email,
      metadata: { orderId: order.id, orderNumber: order.order_number, attemptId: attempt.id },
      payment_intent_data: { metadata: { orderId: order.id, attemptId: attempt.id } },
      success_url: `${SITE_URL}/payment-return?order=${encodeURIComponent(order.order_number)}&method=card`,
      cancel_url: `${SITE_URL}/checkout?stripe_cancelled=1`,
    }, { idempotencyKey: `technest-${attempt.id}` })
    if (!session.url || session.amount_total !== amount || session.currency !== 'ron') throw new ApiError(502, 'Sesiune de plată inconsistentă.')
    const { error } = await sb.from('payment_attempts').update({ provider_id: session.id, status: 'open' }).eq('id', attempt.id)
    if (error) throw new ApiError(503, 'Sesiunea nu a putut fi înregistrată. Reîncearcă aceeași comandă.')
    return NextResponse.json({ success: true, url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
