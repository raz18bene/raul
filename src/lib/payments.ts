import { createHash, timingSafeEqual } from 'node:crypto'
import { createServiceClient } from './supabase'
import { ApiError, bearer, UUID, verifiedUser } from './api-security'
import { storedOrderTotal } from './checkout'

export function tokenMatches(token: unknown, hash: unknown) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) return false
  return timingSafeEqual(createHash('sha256').update(token).digest(), Buffer.from(hash, 'hex'))
}
export async function payableOrder(req: Request, body: Record<string, any>) {
  if (typeof body.orderId !== 'string' || !UUID.test(body.orderId)) throw new ApiError(400, 'Comandă invalidă.')
  if (!bearer(req) && (typeof body.checkoutToken !== 'string' || !/^[a-f0-9]{64}$/.test(body.checkoutToken))) throw new ApiError(401, 'Acces la comandă neautorizat.')
  const sb = createServiceClient()
  const { data: security, error: securityError } = await sb.from('order_security').select('*').eq('order_id', body.orderId).maybeSingle()
  if (securityError) throw new ApiError(503, 'Plata nu poate fi inițiată.')
  if (!security) throw new ApiError(403, 'Comanda necesită verificarea magazinului.')
  const { data: order, error } = await sb.from('orders').select('*, order_items(*)').eq('id', body.orderId).single()
  if (error || !order) throw new ApiError(403, 'Acces la comandă neautorizat.')
  if (!tokenMatches(body.checkoutToken, security.token_hash)) {
    const user = await verifiedUser(bearer(req))
    if (!order.user_id || user.id !== order.user_id) throw new ApiError(403, 'Acces la comandă neautorizat.')
  }
  if (order.payment_method !== 'card' || order.payment_status === 'paid' || !['pending', 'processing'].includes(order.status)) throw new ApiError(409, 'Comanda nu poate fi plătită din nou.')
  const amount = storedOrderTotal(order)
  if (amount !== Number(security.amount_cents) || security.currency !== 'ron') throw new ApiError(409, 'Comanda necesită verificare.')
  return { sb, order, amount }
}
export async function paymentAttempt(sb: ReturnType<typeof createServiceClient>, orderId: string, provider: 'stripe' | 'netopia', amount: number) {
  const inserted = await sb.from('payment_attempts').insert({ order_id: orderId, provider, amount_cents: amount, currency: 'ron' }).select().single()
  if (inserted.error && inserted.error.code !== '23505') throw new ApiError(503, 'Plata nu poate fi inițiată.')
  const result = inserted.data ? inserted : await sb.from('payment_attempts').select('*').eq('order_id', orderId).single()
  const a = result.data
  if (result.error || !a) throw new ApiError(503, 'Plata nu poate fi inițiată.')
  if (a.provider !== provider || Number(a.amount_cents) !== amount || a.currency !== 'ron' || !['creating', 'open'].includes(a.status)) throw new ApiError(409, 'Plata existentă necesită verificare.')
  if (!Number.isFinite(Date.parse(a.created_at)) || Date.now() - Date.parse(a.created_at) > 23 * 3600000) throw new ApiError(409, 'Sesiunea a expirat. Contactează magazinul înainte de o nouă plată.')
  return a
}
export function validateStripeSession(session: any, attempt: any, order: any, live: boolean) {
  const amount = storedOrderTotal(order)
  if (session.id !== attempt.provider_id || attempt.provider !== 'stripe' || session.mode !== 'payment' || session.livemode !== live
    || session.currency !== 'ron' || session.amount_total !== amount || Number(attempt.amount_cents) !== amount
    || attempt.currency !== 'ron' || attempt.order_id !== order.id || order.payment_method !== 'card'
    || session.client_reference_id !== order.order_number || session.metadata?.orderId !== order.id || session.metadata?.attemptId !== attempt.id) throw new ApiError(400, 'Confirmare de plată neconcordantă.')
}
export async function recordPayment(attempt: any, providerId: string, eventId: string, paid: boolean) {
  const { error } = await createServiceClient().rpc('record_verified_payment', {
    p_attempt: attempt.id, p_provider: attempt.provider, p_provider_id: providerId, p_event: eventId,
    p_amount: Number(attempt.amount_cents), p_currency: attempt.currency, p_paid: paid,
  })
  if (error) throw new ApiError(error.code === '22023' ? 400 : 503, 'Confirmarea plății necesită reverificare.')
}
