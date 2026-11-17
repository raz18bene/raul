export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin, apiError } from '@/lib/api-security'
import { createServiceClient } from '@/lib/supabase'
import { sendWithdrawalReceipt } from '@/lib/withdrawals'
// Recovery after email outages. Production needs timely operational monitoring.
export async function POST(req: Request) {
  try {
    await requireAdmin(req)
    const { data, error } = await createServiceClient().from('withdrawal_requests').select('*')
      .is('confirmation_sent_at', null).order('submitted_at').limit(25)
    if (error) throw error
    let sent = 0
    for (const row of data ?? []) if (await sendWithdrawalReceipt(row)) sent++
    return NextResponse.json({ success: sent === data?.length, sent, pending: (data?.length ?? 0) - sent })
  } catch (error) { return apiError(error) }
}
