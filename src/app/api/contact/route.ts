export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const TYPE_LABELS: Record<string, string> = {
  'contact':       '📩 Mesaj Contact',
  'oferta-print3d':'🖨️ Cerere Ofertă Print 3D',
  'cerere-retur':  '↩️ Cerere Retur',
}

function buildEmailHtml(body: any) {
  const typeLabel = TYPE_LABELS[body.type] || body.type || 'Cerere nouă'

  // Build rows based on type
  const rows: [string, string][] = [
    ['Nume', body.name],
    ['Email', body.email],
  ]
  if (body.phone)       rows.push(['Telefon', body.phone])
  if (body.material)    rows.push(['Material', body.material])
  if (body.orderNumber) rows.push(['Nr. Comandă', body.orderNumber])
  if (body.productName) rows.push(['Produs', body.productName])
  if (body.reason)      rows.push(['Motiv retur', body.reason])
  if (body.bankIBAN)    rows.push(['IBAN', body.bankIBAN])
  if (body.bankName)    rows.push(['Bancă', body.bankName])

  const rowsHtml = rows.map(([label, val]) => `
    <tr>
      <td style="padding:8px 0;color:#718096;width:130px;vertical-align:top;">${label}:</td>
      <td style="padding:8px 0;font-weight:600;color:#1a202c;">${val || '-'}</td>
    </tr>`).join('')

  const messageHtml = body.message ? `
    <div style="background:#f7fafc;border-left:4px solid #00a8cc;padding:12px 16px;margin-top:16px;border-radius:4px;">
      <p style="margin:0;color:#4a5568;line-height:1.7;white-space:pre-wrap;">${body.message}</p>
    </div>` : ''

  const fileHtml = body.fileUrl ? `
    <div style="margin-top:16px;padding:12px;background:#ebf8ff;border-radius:8px;">
      <a href="${body.fileUrl}" style="color:#00a8cc;font-weight:600;">📎 Descarcă fișierul atașat</a>
    </div>` : ''

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0a0e27;padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#00d9ff;font-family:monospace;margin:0;font-size:1.4rem;">
          Tech<span style="color:#ff6b35;">Nest</span>
        </h1>
        <p style="color:#a0aec0;margin:6px 0 0;font-size:0.9rem;">${typeLabel}</p>
      </div>
      <div style="background:#ffffff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
        <h2 style="color:#1a202c;margin-top:0;">${typeLabel}</h2>
        <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
        ${messageHtml}
        ${fileHtml}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="color:#a0aec0;font-size:0.78rem;margin:0;">
          Trimis de pe raul-opal.vercel.app · ${new Date().toLocaleString('ro-RO')}
        </p>
      </div>
    </div>`
}

function buildSubject(body: any) {
  const prefix = TYPE_LABELS[body.type] || 'Cerere nouă'
  return `[TechNest] ${prefix} — ${body.name}`
}

export async function POST(req: Request) {
  const body = await req.json()

  // 1. Save to Supabase
  try {
    const supabase = createServiceClient()

    // Build message that includes all fields for retur
    let fullMessage = body.message || ''
    if (body.type === 'cerere-retur') {
      const parts = []
      if (body.orderNumber) parts.push(`Nr. comandă: ${body.orderNumber}`)
      if (body.productName) parts.push(`Produs: ${body.productName}`)
      if (body.reason)      parts.push(`Motiv: ${body.reason}`)
      if (body.bankIBAN)    parts.push(`IBAN: ${body.bankIBAN}`)
      if (body.bankName)    parts.push(`Bancă: ${body.bankName}`)
      if (parts.length) fullMessage = parts.join('\n')
    }

    const { error } = await supabase.from('contact_requests').insert({
      name:       body.name,
      email:      body.email,
      phone:      body.phone    || null,
      material:   body.material || null,
      message:    fullMessage   || null,
      type:       body.type     || 'contact',
      file_url:   body.fileUrl  || null,
      status:     'new',
      created_at: new Date().toISOString(),
    })
    if (error) console.warn('Supabase insert warn:', error.message)
  } catch (e) {
    console.warn('Supabase error:', e)
  }

  // 2. Send email via Resend
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
          from:     'TechNest <onboarding@resend.dev>',
          to:       ['technest.prototyping@gmail.com'],
          reply_to: body.email,
          subject:  buildSubject(body),
          html:     buildEmailHtml(body),
        }),
      })
      if (!r.ok) {
        const err = await r.text()
        console.warn('Resend error:', r.status, err)
      } else {
        console.log('Email sent OK for type:', body.type)
      }
    } catch (e) {
      console.warn('Resend failed:', e)
    }
  } else {
    console.warn('RESEND_API_KEY not configured')
  }

  return NextResponse.json({ success: true })
}
