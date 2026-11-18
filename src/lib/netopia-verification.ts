import { createHash } from 'node:crypto'
import { importSPKI, jwtVerify } from 'jose'
import { ApiError } from './api-security'
import { money, storedOrderTotal } from './checkout'

export async function verifyNetopia(raw: string, token: string | null, publicKey: string, pos: string) {
  if (!token) throw new ApiError(400, 'Missing verification token')
  if (!publicKey || !pos) throw new ApiError(503, 'Netopia verification is not configured')
  try {
    const key = await importSPKI(publicKey.replace(/\\n/g, '\n'), 'RS512')
    const { payload } = await jwtVerify(token, key, { algorithms: ['RS512'], issuer: 'NETOPIA Payments', audience: pos,
      requiredClaims: ['exp', 'iat', 'sub'], clockTolerance: 30 })
    if (typeof payload.iat !== 'number' || payload.iat > Date.now() / 1000 + 30
      || payload.sub !== createHash('sha512').update(raw).digest('base64')) throw Error('Payload mismatch')
    return JSON.parse(raw)
  } catch { throw new ApiError(400, 'Invalid Netopia notification') }
}
export function validateNetopiaPayment(body: any, attempt: any, order: any) {
  if (!body?.payment || !body?.order || body.payment.ntpID !== attempt.provider_id || attempt.provider !== 'netopia'
    || body.order.orderID !== order.order_number || attempt.order_id !== order.id || order.payment_method !== 'card'
    || body.payment.currency !== 'RON' || money(body.payment.amount) !== storedOrderTotal(order)
    || Number(attempt.amount_cents) !== storedOrderTotal(order) || attempt.currency !== 'ron') throw new ApiError(400, 'Payment mismatch')
  if (body.order.amount != null && money(body.order.amount) !== storedOrderTotal(order)) throw new ApiError(400, 'Order amount mismatch')
  if (body.order.currency != null && body.order.currency !== 'RON') throw new ApiError(400, 'Order currency mismatch')
  // Official v2 constants: 3=PAID, 5=CONFIRMED; 1=NEW never proves payment.
  return [3, 5].includes(body.payment.status) ? 'paid' : [4, 11, 12, 23].includes(body.payment.status) ? 'failed' : 'review'
}
