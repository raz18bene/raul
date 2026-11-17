export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyAttachment, PRINT_BUCKET } from '@/lib/private-files'
import { apiError } from '@/lib/api-security'
import { SITE_URL, BUSINESS } from '@/lib/site'
import { CONTACT_FAILURE, parseContact, deliverContact, contactEmail } from '@/lib/contact'

export async function POST(req: Request) {
  let input: unknown
  try { input = await req.json() }
  catch { return NextResponse.json({ success: false, error: 'Date invalide.' }, { status: 400 }) }
  const raw = input as Record<string, unknown> | null
  if (raw?.fileUrl) return NextResponse.json({ success: false, error: 'Atașament invalid.' }, { status: 400 })
  const body = parseContact(input)
  if (!body) return NextResponse.json({ success: false, error: 'Verifică numele, emailul și mesajul.' }, { status: 400 })

  if (body.type === 'cerere-retur') return NextResponse.json({ success: false, error: 'Folosește funcția de retragere din pagina Politica de retur.' }, { status: 400 })
  if (raw?.attachment) {
    try {
      const attachment = raw.attachment as { path?: unknown; proof?: unknown }
      const path = verifyAttachment(attachment.path, attachment.proof)
      if (body.type !== 'oferta-print3d') return NextResponse.json({ success: false }, { status: 400 })
      const sb = createServiceClient()
      const bucket = await sb.storage.getBucket(PRINT_BUCKET)
      const info = await sb.storage.from(PRINT_BUCKET).info(path)
      if (bucket.error || !bucket.data || bucket.data.public || info.error) return NextResponse.json({ success: false, error: 'Atașamentul nu poate fi confirmat.' }, { status: 400 })
      body.fileUrl = `private:${path}`
    } catch (error) { return apiError(error) }
  }
  const success = await deliverContact(body, {
    async save(data) {
      try {
        const { error } = await createServiceClient().from('contact_requests').insert({
          name: data.name, email: data.email, phone: data.phone || null,
          material: data.material || null, message: data.message,
          type: data.type, file_url: data.fileUrl, status: 'new', created_at: new Date().toISOString(),
        }).abortSignal(AbortSignal.timeout(10000))
        if (error) console.warn('Contact: database registration failed', error.code)
        return !error
      } catch {
        console.warn('Contact: database unavailable or unconfigured')
        return false
      }
    },
    async email(data) {
      const key = process.env.RESEND_API_KEY
      if (!key) { console.warn('Contact: email is not configured'); return false }
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'TechNest <onboarding@resend.dev>',
            to: [BUSINESS.email], reply_to: data.email, ...contactEmail(data, SITE_URL),
          }),
        })
        if (!response.ok) console.warn('Contact: email rejected', response.status)
        return response.ok
      } catch {
        console.warn('Contact: email service unavailable')
        return false
      }
    },
  })
  return success
    ? NextResponse.json({ success: true })
    : NextResponse.json({ success: false, error: CONTACT_FAILURE }, { status: 503 })
}
