export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

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

// Doar adminul are voie sa creeze AWB-uri (costa bani) sau sa vada ID-urile contului SameDay.
// Token-ul de sesiune Supabase vine din panoul de admin; il verificam noi pe server.
async function requireAdmin(token: unknown): Promise<boolean> {
  if (!token || typeof token !== 'string') return false
  try {
    const { data, error } = await createServiceClient().auth.getUser(token)
    if (error || !data?.user) return false
    return (data.user.app_metadata as any)?.role === 'admin'
  } catch {
    return false
  }
}

// Numele câmpurilor din payload-ul catre SameDay, traduse in ceva inteligibil,
// ca sa nu mai trebuiasca cineva sa descifreze raspunsul lor JSON imbricat.
const SAMEDAY_FIELD_LABELS: Record<string, string> = {
  'awbRecipient.name': 'Nume destinatar',
  'awbRecipient.phoneNumber': 'Telefon destinatar',
  'awbRecipient.address': 'Adresă destinatar',
  'awbRecipient.countyString': 'Județ destinatar',
  'awbRecipient.cityString': 'Oraș destinatar',
  'awbRecipient.postalCode': 'Cod poștal destinatar',
  'awbRecipient.email': 'Email destinatar',
  'pickupPoint': 'Punct de ridicare (variabila SAMEDAY_PICKUP_POINT din Vercel)',
  'contactPerson': 'Persoană de contact (variabila SAMEDAY_CONTACT_PERSON din Vercel)',
  'service': 'Serviciu de livrare (variabilele SAMEDAY_SERVICE_ID / SAMEDAY_SERVICE_ID_LOCKER din Vercel)',
  'lockerLastMile': 'Easybox-ul de livrare ales (nu există sau nu e compatibil cu serviciul)',
  'lockerFirstMile': 'Punctul de predare personală (variabila SAMEDAY_FIRST_MILE_LOCKER_ID din Vercel)',
  'packageWeight': 'Greutate colet',
  'packageNumber': 'Număr colete',
  'observation': 'Observație',
}

// SameDay intoarce erorile de validare intr-un arbore de forma
// { children: { camp: { errors: ['mesaj'] }, altCamp: { children: {...} } } }.
// Parcurgem recursiv si scoatem doar campurile care chiar au o eroare atasata,
// cu numele lor tradus, ca sa afisam ceva clar in loc de tot arborele gol.
function extractSamedayErrors(node: any, path: string[] = []): string[] {
  const out: string[] = []
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node.errors) && node.errors.length) {
    const key = path.join('.')
    const label = SAMEDAY_FIELD_LABELS[key] || key || 'Câmp necunoscut'
    out.push(`${label}: ${node.errors.join(' ')}`)
  }
  if (node.children && typeof node.children === 'object') {
    if (Array.isArray(node.children)) {
      node.children.forEach((child: any, i: number) => out.push(...extractSamedayErrors(child, [...path, `#${i + 1}`])))
    } else {
      Object.entries(node.children).forEach(([k, v]) => out.push(...extractSamedayErrors(v, [...path, k])))
    }
  }
  return out
}

// ─── Lista de easybox-uri / puncte de livrare SameDay ────────────────────────
type LockerOut = { id: number; name: string; address: string; city: string; county: string; postalCode: string; lat: number; lng: number }

const asText = (v: any): string => (v && typeof v === 'object' ? String(v.name ?? '') : String(v ?? ''))

function normalizeLocker(l: any): LockerOut | null {
  const id = Number(l?.lockerId ?? l?.id)
  const lat = Number(l?.lat ?? l?.latitude)
  const lng = Number(l?.lng ?? l?.longitude)
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (l?.clientVisible === false) return null
  return {
    id,
    name: asText(l?.name),
    address: asText(l?.address),
    city: asText(l?.city),
    county: asText(l?.county),
    postalCode: asText(l?.postalCode),
    lat,
    lng,
  }
}

// Cache in memoria serverului (lista se schimba rar) — evita sa batem API-ul SameDay la fiecare vizitator.
let lockersCache: { at: number; data: LockerOut[] } | null = null
const LOCKERS_TTL_MS = 6 * 60 * 60 * 1000

async function fetchAllLockers(): Promise<LockerOut[]> {
  if (lockersCache && Date.now() - lockersCache.at < LOCKERS_TTL_MS) return lockersCache.data
  const token = await getSamedayToken()
  const headers = { 'X-AUTH-TOKEN': token }
  const pageUrl = (page: number) => `https://api.sameday.ro/api/client/lockers?page=${page}&countPerPage=500`

  const first = await fetch(pageUrl(1), { headers })
  if (!first.ok) throw new Error(`SameDay lockers ${first.status}`)
  const firstJson: any = await first.json()
  const pages = Math.min(Number(firstJson?.pages) || 1, 40)
  const chunks: any[][] = [firstJson?.data || []]

  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, async (_, i) => {
        const r = await fetch(pageUrl(i + 2), { headers })
        if (!r.ok) return []
        const j: any = await r.json()
        return (j?.data || []) as any[]
      })
    )
    chunks.push(...rest)
  }

  const out: LockerOut[] = []
  const seen = new Set<number>()
  for (const l of chunks.flat()) {
    const n = normalizeLocker(l)
    if (n && !seen.has(n.id)) { seen.add(n.id); out.push(n) }
  }
  if (out.length > 0) lockersCache = { at: Date.now(), data: out }
  return out
}

export async function POST(req: Request) {
  let action: string, body: any
  try {
    ({ action, ...body } = await req.json())
  } catch {
    return NextResponse.json({ success: false, error: 'Cerere invalidă.' }, { status: 400 })
  }

  // Toate actiunile de aici cer un admin autentificat.
  if (!(await requireAdmin(body.accessToken))) {
    return NextResponse.json({ success: false, error: 'Neautorizat — autentifică-te ca admin.' }, { status: 401 })
  }

  // ── Diagnostic: ID-urile contului SameDay (puncte de ridicare, persoane de contact, servicii) ──
  if (action === 'diag') {
    try {
      const token = await getSamedayToken()
      const headers = { 'X-AUTH-TOKEN': token }
      const [pp, sv] = await Promise.all([
        fetch('https://api.sameday.ro/api/client/pickup-points', { headers }),
        fetch('https://api.sameday.ro/api/client/services', { headers }),
      ])
      const ppJson: any = pp.ok ? await pp.json() : null
      const svJson: any = sv.ok ? await sv.json() : null
      const pickupPoints = (ppJson?.data || []).map((p: any) => ({
        id: p.id,
        alias: p.alias,
        address: asText(p.address),
        contactPersons: (p.pickupPointContactPerson || []).map((c: any) => ({ id: c.id, name: c.name, default: !!c.defaultContactPerson })),
      }))
      const svList: any[] = Array.isArray(svJson) ? svJson : (svJson?.data || svJson?.services || [])
      const services = svList.map((s: any) => ({ id: s.id, name: s.name, code: s.code ?? s.serviceCode ?? '' }))
      return NextResponse.json({ success: true, pickupPoints, services, servicesRaw: services.length ? undefined : svJson })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
  }

  // ── Create AWB ──
  if (action === 'create-awb') {
    try {
      // "pickupPoint", "service" si "contactPerson" sunt ID-uri numerice din contul tau SameDay
      // (Puncte de lucru / Persoane de contact / Servicii, din panoul lor de client) — NU
      // sunt informatii despre client, ci despre EXPEDITOR (tu). Daca oricare din ele
      // lipseste sau e gresit, SameDay respinge AWB-ul spunand ca "toate" campurile sunt
      // invalide (pentru ca cererea ajunge malformata la ei).
      const lockerId = Number(body.lockerId)
      const isLocker = Number.isFinite(lockerId) && lockerId > 0
      const personalHandover = body.personalHandover === true

      const pickupPoint = parseInt(process.env.SAMEDAY_PICKUP_POINT || '')
      // Livrarea in easybox foloseste alt serviciu SameDay ("Locker NextDay"), nu cel de curier la usa.
      const serviceEnvName = isLocker ? 'SAMEDAY_SERVICE_ID_LOCKER' : 'SAMEDAY_SERVICE_ID'
      const service = parseInt(process.env[serviceEnvName] || '')
      const contactPerson = parseInt(process.env.SAMEDAY_CONTACT_PERSON || '')
      const firstMileId = parseInt(process.env.SAMEDAY_FIRST_MILE_LOCKER_ID || '')

      const missingEnv = [
        !pickupPoint || isNaN(pickupPoint) ? 'SAMEDAY_PICKUP_POINT' : null,
        !service || isNaN(service) ? serviceEnvName : null,
        !contactPerson || isNaN(contactPerson) ? 'SAMEDAY_CONTACT_PERSON' : null,
        personalHandover && (!firstMileId || isNaN(firstMileId)) ? 'SAMEDAY_FIRST_MILE_LOCKER_ID' : null,
      ].filter(Boolean)
      if (missingEnv.length) {
        return NextResponse.json({
          success: false,
          error: `Configurare SameDay incompletă în Vercel — lipsesc/sunt greșite: ${missingEnv.join(', ')}. Apasă butonul „🔎 ID-uri SameDay” din panoul de admin ca să vezi ID-urile din contul tău, apoi adaugă-le ca variabile de mediu în Vercel.`,
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
        cashOnDelivery: Number(body.cashOnDelivery) || 0,
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
      // Livrare in easybox: coletul ajunge in lockerul ales de client
      if (isLocker) payload.lockerLastMile = lockerId
      // Predare personala: tu duci coletul la punctul fix SameDay (ex. punctul de colectare din magazin)
      if (personalHandover) payload.lockerFirstMile = firstMileId
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
      if (!r.ok) {
        // Traducem eroarea SameDay intr-un mesaj clar, cu exact ce camp e gresit si de ce,
        // in loc sa afisam arborele JSON brut care nu spune nimic la prima vedere.
        const problems = d?.errors ? extractSamedayErrors(d.errors) : []
        const friendlyMessage = problems.length
          ? `SameDay a respins comanda de livrare din cauza acestor câmpuri:\n• ${problems.join('\n• ')}`
          : (d?.message || `SameDay a respins cererea (${r.status}), fără detalii suplimentare.`)
        return NextResponse.json({ success: false, error: friendlyMessage, details: d ?? rawText?.slice(0, 800) }, { status: 400 })
      }
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

  // Lista publica de easybox-uri pentru harta din checkout (nu contine nimic secret).
  if (action === 'lockers') {
    try {
      const lockers = await fetchAllLockers()
      return NextResponse.json(
        { ok: true, count: lockers.length, lockers },
        { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } }
      )
    } catch (e: any) {
      console.error('Eroare SameDay lockers:', e)
      return NextResponse.json({ ok: false, error: 'Lista de easybox-uri nu a putut fi încărcată acum.' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
