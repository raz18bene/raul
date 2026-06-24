import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = createServiceClient()

  await supabase.from('contact_requests').insert({
    name: body.name, email: body.email, phone: body.phone || null,
    material: body.material || null, message: body.message || null,
    type: body.type || 'contact', file_url: body.fileUrl || null,
    status: 'new', created_at: new Date().toISOString(),
  })

  // Send email via Resend if configured
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TechNest <noreply@technest.ro>',
          to: ['technest.prototyping@gmail.com'],
          reply_to: body.email,
          subject: `Cerere nouă — ${body.name}`,
          html: `<h2>Cerere ${body.type}</h2><p><b>Nume:</b> ${body.name}</p><p><b>Email:</b> ${body.email}</p><p><b>Telefon:</b> ${body.phone || '-'}</p><p><b>Material:</b> ${body.material || '-'}</p><p><b>Mesaj:</b> ${body.message || '-'}</p>${body.fileUrl ? `<p><b>Fișier:</b> <a href="${body.fileUrl}">Descarcă</a></p>` : ''}`,
        }),
      })
    } catch (e) { console.warn('Resend failed:', e) }
  }

  return NextResponse.json({ success: true })
}
