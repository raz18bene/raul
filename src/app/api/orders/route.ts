export const dynamic = 'force-dynamic'
import { randomBytes, createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { issueOblioDocument } from '@/lib/oblio'
import { apiError, ApiError, bearer, jsonBody, verifiedUser } from '@/lib/api-security'
import { checkoutInput } from '@/lib/checkout'

export async function POST(req: Request) {
  try {
    const body = await jsonBody(req)
    const { items, customer, expectedTotal } = checkoutInput(body)
    const token = bearer(req) ?? body.accessToken
    const user = token ? await verifiedUser(token) : null
    const checkoutToken = randomBytes(32).toString('hex')
    const sb = createServiceClient()
    const { data, error } = await sb.rpc('create_secure_order', {
      p_customer: customer, p_items: items, p_user_id: user?.id ?? null,
      p_token_hash: createHash('sha256').update(checkoutToken).digest('hex'), p_expected_total: expectedTotal,
    })
    if (error) {
      if (['22023', '22P02', '22003'].includes(error.code)) throw new ApiError(409, 'Prețul sau disponibilitatea s-a schimbat. Verifică produsele și reîncearcă.')
      throw new ApiError(503, 'Comanda nu a putut fi înregistrată. Contactează magazinul.')
    }
    if (!data?.orderId) throw new ApiError(503, 'Comanda nu a fost confirmată.')
    if (user) {
      try {
        const profile = await sb.from('profiles').upsert({ id: user.id, full_name: customer.customer_name, phone: customer.customer_phone,
          address: customer.shipping_address.street, city: customer.shipping_address.city, county: customer.shipping_address.county,
          postal_code: customer.shipping_address.postal_code, updated_at: new Date().toISOString() })
        if (profile.error) console.warn('Order saved; profile update unavailable')
      } catch { console.warn('Order saved; profile update unavailable') }
    }
    if (customer.billing.type === 'pj' && customer.payment_method !== 'card') {
      const result = await issueOblioDocument('proforma', data.orderId)
      if (!result.success) console.warn('Order proforma requires admin review')
    }
    // Never invoke a public stock-decrement endpoint with visitor-supplied items.
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(10000),
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || 'TechNest <onboarding@resend.dev>',
            to: [customer.customer_email, 'technest.prototyping@gmail.com'], subject: `Comandă înregistrată — ${data.orderNumber}`,
            text: `Comanda ${data.orderNumber} a fost înregistrată. Total: ${data.total} RON. Înregistrarea comenzii nu confirmă plata cu cardul.` }),
        })
        if (!response.ok) console.warn('Order confirmation email rejected')
      } catch { console.warn('Order confirmation email unavailable') }
    }
    return NextResponse.json({ success: true, ...data, checkoutToken }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
