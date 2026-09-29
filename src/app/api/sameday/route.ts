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
  let action: string, body: any
  try {
    ({ action, ...body } = await req.json())
  } catch {
    return NextResponse.json({ success: false, error: 'Cerere invalidă.' }, { status: 400 })
  }

  // ── Create AWB ──
  if (action === 'create-awb') {
    try {
      // "pickupPoint", "service" si "contactPerson" sunt ID-uri numerice din contul tau SameDay
      // (Puncte de lucru / Persoane de contact / Servicii, din panoul lor de client) — NU
      // sunt informatii despre client, ci despre EXPEDITOR (tu). Daca oricare din ele
      // lipseste sau e gresit, SameDay respinge AWB-ul spunand ca "toate" campurile sunt
      // invalide (pentru ca cererea ajunge malformata la ei).
      const pickupPoint = parseInt(process.env.SAMEDAY_PICKUP_POINT || '')
      const service = parseInt(process.env.SAMEDAY_SERVICE_ID || '')
      const contactPerson = parseInt(process.env.SAMEDAY_CONTACT_PERSON || '')
      const missingEnv = [
        !pickupPoint || isNaN(pickupPoint) ? 'SAMEDAY_PICKUP_POINT' : null,
        !service || isNaN(service) ? 'SAMEDAY_SERVICE_ID' : null,
        !contactPerson || isNaN(contactPerson) ? 'SAMEDAY_CONTACT_PERSON' : null,
      ].filter(Boolean)
      if (missingEnv.length) {
        return NextResponse.json({
          success: false,
          error: `Configurare SameDay incompletă în Vercel — lipsesc/sunt greșite: ${missingEnv.join(', ')}. Ia ID-urile din panoul tău SameDay (Puncte de lucru → pickupPoint, Persoane de contact → contactPerson, Servicii → service) și adaugă-le ca variabile de mediu.`,
        }, { status: 500 })
      }

      const token = await getSamedayToken()

      // Structura corecta cerută de API-ul SameDay: obiectul se numește "awbRecipient"
      // (nu "recipient"), iar orasul/judetul se trimit ca text simplu ("countyString"/
      // "cityString"), nu ca obiecte imbricate {name: ...} — asta era motivul pentru care
      // SameDay respingea aproape toate campurile ca lipsa.
      const payload: any = {
        pickupPoint,
        contactPerson,
        service,
        packageType: 1,
        packageNumber: body.parcels || 1,
        packageWeight: body.weight || 1,
        awbPayment: 1, // 1 = plătit de expeditor (tu)
        thirdPartyPickup: 0,
        cashOnDelivery: body.cashOnDelivery || 0,
        cashOnDeliveryReturns: 1,
        insuredValue: 0,
        observation: `Comanda ${body.orderNumber}`,
        clientInternalReference: body.orderNumber || '',
        awbRecipient: {
          name: body.recipientName,
          phoneNumber: body.recipientPhone,
          personType: 0, // 0 = persoana fizica
          address: body.recipientAddress,
          countyString: body.recipientCounty || '',
          cityString: body.recipientCity || '',
          postalCode: body.recipientPostalCode || '',
          email: body.recipientEmail || '',
        },
        parcels: Array.from({ length: body.parcels || 1 }, () => ({
          weight: body.weight || 1, width: 20, length: 30, height: 10,
        })),
      }
      // Optional — doar daca ai configurat un punct de retur in contul SameDay
      if (process.env.SAMEDAY_RETURN_LOCATION_ID) {
        payload.returnLocationId = parseInt(process.env.SAMEDAY_RETURN_LOCATION_ID)
      }

      const r = await fetch('https://api.sameday.ro/api/awb', {
        method: 'POST',
        headers: { 'X-AUTH-TOKEN': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const rawText = await r.text()
      let d: any = null
      try { d = rawText ? JSON.parse(rawText) : null } catch { /* raspuns non-JSON de la SameDay */ }
      if (!r.ok) return NextResponse.json({ success: false, error: 'SameDay error', details: d ?? rawText?.slice(0, 800) }, { status: 400 })
      return NextResponse.json({ success: true, awbNumber: d?.awbNumber })
    } catch (e: any) {
      console.error('Eroare SameDay create-awb:', e)
      return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
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

  // Endpoint de diagnostic: arata ID-urile reale de "pickupPoint" si "contactPerson"
  // direct din contul tau SameDay — astea NU apar nicaieri in panoul web, doar prin API.
  // Deschide in browser: https://<domeniul-tau>/api/sameday?action=pickup-points
  if (action === 'pickup-points') {
    try {
      const token = await getSamedayToken()
      const r = await fetch('https://api.sameday.ro/api/client/pickup-points', {
        headers: { 'X-AUTH-TOKEN': token },
      })
      const rawText = await r.text()
      let d: any = null
      try { d = rawText ? JSON.parse(rawText) : null } catch { /* raspuns non-JSON */ }
      if (!r.ok) return NextResponse.json({ ok: false, error: 'SameDay a refuzat cererea', details: d ?? rawText?.slice(0, 800) }, { status: 400 })

      // Extragem doar ce ne intereseaza, ca sa fie usor de citit
      const points = (d?.data || d?.pickupPoints || d || []).map?.((p: any) => ({
        pickupPointId: p.id,
        pickupPointAddress: `${p.address?.county?.name || p.county || ''}, ${p.address?.city?.name || p.city || ''}, ${p.address?.street || ''}`,
        contactPersons: (p.contactPersons || p.contacts || []).map?.((c: any) => ({
          contactPersonId: c.id,
          name: c.name || c.person || '',
          isDefault: c.default ?? c.isDefault ?? null,
        })) ?? [],
      })) ?? []

      return NextResponse.json({ ok: true, points, raw: d })
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
