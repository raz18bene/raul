export type ContactSubmission = {
  name: string; email: string; phone: string; message: string; material: string
  type: 'contact' | 'oferta-print3d' | 'cerere-retur'; fileUrl: string | null
}

export const CONTACT_FAILURE = 'Cererea nu a putut fi înregistrată. Încearcă din nou sau contactează-ne telefonic la 0754 545 800.'

export function parseContact(value: unknown): ContactSubmission | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const limits = { name: 200, email: 254, phone: 50, message: 10000, material: 100 } as const
  const fields = {} as Record<keyof typeof limits, string>
  for (const [key, limit] of Object.entries(limits)) {
    const input = raw[key] ?? ''
    if (typeof input !== 'string' || input.length > limit) return null
    fields[key as keyof typeof limits] = input.trim()
  }
  if (!fields.name || !fields.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return null
  if (/[\r\n]/.test(fields.name)) return null
  const type = raw.type ?? 'contact'
  if (type !== 'contact' && type !== 'oferta-print3d' && type !== 'cerere-retur') return null
  let fileUrl: string | null = null
  if (raw.fileUrl != null && raw.fileUrl !== '') {
    if (type !== 'oferta-print3d' || typeof raw.fileUrl !== 'string' || raw.fileUrl.length > 2048) return null
    try {
      const url = new URL(raw.fileUrl)
      if (url.protocol !== 'https:' || url.username || url.password) return null
      fileUrl = url.href
    } catch { return null }
  }
  return { ...fields, type, fileUrl }
}

// Shared by all three forms: an HTTP error, malformed response or success:false
// must never switch the UI to the success screen.
export async function submitContact(body: unknown, send: typeof fetch = fetch): Promise<void> {
  try {
    const response = await send('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || result?.success !== true) throw new Error(CONTACT_FAILURE)
  } catch { throw new Error(CONTACT_FAILURE) }
}

export async function deliverContact(body: ContactSubmission, channels: {
  save: (body: ContactSubmission) => Promise<boolean>
  email: (body: ContactSubmission) => Promise<boolean>
}): Promise<boolean> {
  const results = await Promise.allSettled([channels.save(body), channels.email(body)])
  // An accepted email OR a persisted request is a valid registration. A failed
  // secondary channel must not invite a retry that duplicates a saved request.
  return results.some(result => result.status === 'fulfilled' && result.value === true)
}

const labels = {
  contact: 'Mesaj Contact', 'oferta-print3d': 'Cerere Ofertă Print 3D', 'cerere-retur': 'Cerere Retur',
}
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]!))

export function contactEmail(body: ContactSubmission, siteUrl: string) {
  const rows = [['Nume', body.name], ['Email', body.email], ['Telefon', body.phone], ['Material', body.material]]
    .filter(([, value]) => value)
    .map(([label, value]) => `<tr><th align="left">${label}</th><td>${escapeHtml(value)}</td></tr>`).join('')
  return {
    subject: `[TechNest] ${labels[body.type]} — ${body.name}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px"><h1>TechNest</h1><h2>${labels[body.type]}</h2><table>${rows}</table><p style="white-space:pre-wrap">${escapeHtml(body.message)}</p>${body.fileUrl ? `<p><a href="${escapeHtml(body.fileUrl)}">Descarcă fișierul atașat</a></p>` : ''}<hr><p>Trimis de pe ${escapeHtml(siteUrl)}</p></div>`,
  }
}
