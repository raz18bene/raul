export const dynamic = 'force-dynamic'
import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { ApiError, apiError } from '@/lib/api-security'
import { verifyNetopia, validateNetopiaPayment } from '@/lib/netopia-verification'
import { recordPayment } from '@/lib/payments'

export async function POST(req: Request) {
  try {
    const raw = await req.text()
    const body = await verifyNetopia(raw, req.headers.get('verification-token'), process.env.NETOPIA_IPN_PUBLIC_KEY ?? '', process.env.NETOPIA_SIGNATURE ?? '')
    if (typeof body?.payment?.ntpID !== 'string') throw new ApiError(400, 'Missing transaction')
    const sb = createServiceClient()
    const { data: attempt, error } = await sb.from('payment_attempts').select('*').eq('provider', 'netopia').eq('provider_id', body.payment.ntpID).maybeSingle()
    if (error) throw new ApiError(503, 'Database unavailable')
    if (!attempt) throw new ApiError(409, 'Unregistered payment requires manual reconciliation')
    const result = await sb.from('orders').select('*, order_items(*)').eq('id', attempt.order_id).single()
    if (result.error || !result.data) throw new ApiError(503, 'Order unavailable')
    const status = validateNetopiaPayment(body, attempt, result.data)
    if (status === 'review') console.warn('Netopia event requires reconciliation', body.payment.status)
    else await recordPayment(attempt, body.payment.ntpID, createHash('sha256').update(raw).digest('hex'), status === 'paid')
    return NextResponse.json({ errorCode: 0, errorMessage: '' })
  } catch (error) { return apiError(error) }
}
