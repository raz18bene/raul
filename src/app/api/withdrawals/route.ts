export const dynamic = 'force-dynamic'
import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { apiError, ApiError, jsonBody } from '@/lib/api-security'
import { createServiceClient } from '@/lib/supabase'
import { withdrawalInput, withdrawalReceipt, sendWithdrawalReceipt } from '@/lib/withdrawals'
export async function POST(req: Request) {
  try {
    const raw = await jsonBody(req), body = withdrawalInput(raw)
    const { data, error } = await createServiceClient().rpc('register_withdrawal', {
      p_key: raw.requestKey, p_hash: createHash('sha256').update(JSON.stringify(body)).digest('hex'),
      p_name: body.name, p_email: body.email, p_contract: body.contract, p_message: body.message,
    })
    if (error || !data) throw new ApiError(error?.code === '22023' ? 409 : 503, 'Declarația nu a putut fi înregistrată. Poți trimite retragerea prin email la technest.prototyping@gmail.com.')
    const emailSent = await sendWithdrawalReceipt(data)
    return NextResponse.json({ success: true, id: data.id, submittedAt: data.submitted_at, receipt: withdrawalReceipt(data), emailSent }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
