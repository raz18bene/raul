export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
// SameDay auth helper
async function getSamedayToken() {
  const r = await fetch('https://api.sameday.ro/api/authenticate', {
    method: 'POST',
    headers: {
      'X-AUTH-USERNAME': process.env.SAMEDAY_USERNAME!,
      'X-AUTH-PASSWORD': process.env.SAMEDAY_PASSWORD!,
      'Content-Type': 'application/json',
    },
  })
  if (!r.ok) throw new Error('SameDay auth failed')
  const d = await r.json()
  return d.token as string
}

export async function POST(req: Request) {
  const { action, ...body } = await req.json()

  // ── Create AWB ──
  if (action === 'create-awb') {
    try {
      const token = await getSamedayToken()
      const payload = {
        pickupPoint: parseInt(process.env.SAMEDAY_PICKUP_POINT!),
        packageType: 1,
        packageNumber: body.parcels || 1,
        packageWeight: body.weight || 1,
        service: parseInt(process.env.SAMEDAY_SERVICE_ID!),
        awbPayment: 1,
        cashOnDelivery: body.cashOnDelivery || 0,
        insuredValue: 0,
        thirdPartyPickup: 0,
        observation: `Comanda ${body.orderNumber}`,
        clientInternalReference: body.orderNumber || '',
        recipient: {
          name: body.recipientName,
          phoneNumber: body.recipientPhone,
          address: body.recipientAddress,
          locality: { name: body.recipientCity },
          county: { name: body.recipientCounty },
          postalCode: body.recipientPostalCode || '',
          email: body.recipientEmail || '',
          personType: 0,
        },
        parcels: Array.from({ length: body.parcels || 1 }, () => ({
          weight: body.weight || 1, width: 20, length: 30, height: 10,
        })),
      }

      const r = await fetch('https://api.sameday.ro/api/awb', {
        method: 'POST',
        headers: { 'X-AUTH-TOKEN': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (!r.ok) return NextResponse.json({ error: 'SameDay error', details: d }, { status: 400 })
      return NextResponse.json({ success: true, awbNumber: d.awbNumber })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'test') {
    try {
      const token = await getSamedayToken()
      return NextResponse.json({ ok: true, message: 'SameDay ✅', token_preview: token.slice(0, 10) + '...' })
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
