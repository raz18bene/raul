export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
// The storefront uses Stripe. Legacy Netopia initiation mixed protocols and trusted
// visitor totals. Keep it closed until a v2 initiation flow is validated in sandbox.
export async function POST() {
  return NextResponse.json({ success: false, error: 'Inițierea Netopia necesită configurare și verificare. Folosește metoda de plată disponibilă în checkout.' }, { status: 503 })
}
