export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const body = await req.json()
  
  // Save to Supabase
  try {
    const supabase = createServiceClient()
    await supabase.from('contact_requests').insert({
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      material: body.material || null,
      message: body.message || null,
      type: body.type || 'contact',
      file_url: body.fileUrl || null,
      status: 'new',
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    console.warn('Supabase insert warn:', e)
  }

  // Send via Resend
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TechNest <onboarding@resend.dev>',
          to: ['technest.prototyping@gmail.com'],
          reply_to: body.email,
          subject: `[TechNest] ${body.type === 'oferta-print3d' ? 'Cerere ofertă Print 3D' : 'Mesaj nou contact'} — ${body.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0a0e27; padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #00d9ff; font-family: monospace; margin: 0; font-size: 1.4rem;">Tech<span style="color: #ff6b35;">Nest</span></h1>
                <p style="color: #a0aec0; margin: 4px 0 0; font-size: 0.85rem;">Cerere nouă</p>
              </div>
              <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <h2 style="color: #1a202c; margin-top: 0;">${body.type === 'oferta-print3d' ? '🖨️ Cerere Ofertă Print 3D' : '📩 Mesaj Contact'}</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #718096; width: 120px;">Nume:</td><td style="padding: 8px 0; font-weight: 600; color: #1a202c;">${body.name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #718096;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${body.email}" style="color: #00a8cc;">${body.email}</a></td></tr>
                  ${body.phone ? `<tr><td style="padding: 8px 0; color: #718096;">Telefon:</td><td style="padding: 8px 0; color: #1a202c;">${body.phone}</td></tr>` : ''}
                  ${body.material ? `<tr><td style="padding: 8px 0; color: #718096;">Material:</td><td style="padding: 8px 0; color: #1a202c;">${body.material}</td></tr>` : ''}
                </table>
                ${body.message ? `
                <div style="background: #f7fafc; border-left: 4px solid #00a8cc; padding: 12px 16px; margin-top: 16px; border-radius: 4px;">
                  <p style="margin: 0; color: #4a5568; line-height: 1.7;">${body.message}</p>
                </div>` : ''}
                ${body.fileUrl ? `
                <div style="margin-top: 16px; padding: 12px; background: #ebf8ff; border-radius: 8px;">
                  <a href="${body.fileUrl}" style="color: #00a8cc; font-weight: 600;">📎 Descarcă fișierul atașat</a>
                </div>` : ''}
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #a0aec0; font-size: 0.78rem; margin: 0;">Trimis prin formularul de pe technest.ro</p>
              </div>
            </div>
          `,
        }),
      })
      if (!r.ok) {
        const err = await r.text()
        console.warn('Resend error:', r.status, err)
      }
    } catch (e) {
      console.warn('Resend failed:', e)
    }
  } else {
    console.warn('RESEND_API_KEY not set — email not sent')
  }

  return NextResponse.json({ success: true })
}
