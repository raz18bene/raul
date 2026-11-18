import { ApiError, textField, UUID } from './api-security'
import { BUSINESS } from './site'
import { createServiceClient } from './supabase'
export function withdrawalInput(raw: Record<string, any>) {
  const name = textField(raw.name, 200, true), email = textField(raw.email, 254, true)
  const contract = textField(raw.contract, 1000, true), details = textField(raw.details, 3000)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof raw.requestKey !== 'string' || !UUID.test(raw.requestKey) || raw.confirm !== true) throw new ApiError(400, 'Confirmă numele, emailul și contractul.')
  return { name, email, contract, message: `Declar retragerea din contractul identificat mai sus.${details ? '\nDetalii: ' + details : ''}` }
}
export function withdrawalReceipt(row: { id: string; name: string; email: string; contract: string; message: string; submitted_at: string }) {
  return `TechNest Prototyping — Confirmare de primire a retragerii\nReferință: ${row.id}\nData și ora transmiterii: ${new Date(row.submitted_at).toISOString()} (UTC)\nNume: ${row.name}\nEmail pentru confirmare: ${row.email}\nContract / comandă: ${row.contract}\nDeclarație: ${row.message}\n\nAceasta confirmă primirea declarației, nu efectuarea rambursării. Pentru informații despre returnarea bunurilor: ${BUSINESS.email}, ${BUSINESS.phone}.`
}
export async function sendWithdrawalReceipt(row: any) {
  if (row.confirmation_sent_at) return true
  if (!process.env.RESEND_API_KEY) return false
  try {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `withdrawal-${row.id}` },
      body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || 'TechNest <onboarding@resend.dev>', to: [row.email, BUSINESS.email],
        subject: `Confirmare de primire a retragerii — ${row.id}`, text: withdrawalReceipt(row) }),
    })
    if (!response.ok) return false
    const result = await createServiceClient().from('withdrawal_requests').update({ confirmation_sent_at: new Date().toISOString() }).eq('id', row.id)
    if (result.error) console.warn('Withdrawal confirmation requires reconciliation')
    return true
  } catch { return false }
}
