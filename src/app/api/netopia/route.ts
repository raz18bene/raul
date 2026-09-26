export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
export async function POST(req: Request) {
  try {
    return await handlePayment(req)
  } catch (e: any) {
    // Plasa de siguranta finala: orice eroare neasteptata tot trebuie sa iasa ca JSON,
    // altfel clientul (checkout) crapa la res.json() cu "Unexpected end of JSON input".
    console.error('Eroare neasteptata in /api/netopia:', e)
    return NextResponse.json({ success: false, error: 'A apărut o eroare neașteptată la inițierea plății. Comanda ta a fost înregistrată — te rugăm să reîncerci plata sau să ne contactezi.' }, { status: 500 })
  }
}

async function handlePayment(req: Request) {
  // Orice eroare de aici incolo TREBUIE sa se termine tot cu un raspuns JSON valid —
  // altfel clientul (checkout) crapa la res.json() cu "Unexpected end of JSON input",
  // chiar daca intre timp comanda a fost deja creata cu succes in baza de date.
  let orderData: any
  try {
    orderData = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Cerere invalidă către Netopia (fără date de comandă).' }, { status: 400 })
  }

  const signature   = process.env.NETOPIA_SIGNATURE!
  const publicKey   = process.env.NETOPIA_PUBLIC_KEY!

  if (!signature || !publicKey) {
    return NextResponse.json({ success: false, error: 'Netopia not configured' }, { status: 500 })
  }

  const host = req.headers.get('host') || ''
  const proto = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`

  const payload = {
    config: {
      emailTemplate: 'confirm',
      notifyUrl: `${baseUrl}/api/netopia/callback`,
      redirectUrl: `${baseUrl}/payment-return?order=${orderData.orderNumber}`,
      language: 'ro',
    },
    payment: {
      options: { installments: 1, bonus: 0 },
      instrument: { type: 'card', account: '', expMonth: '', expYear: '', secretCode: '', token: '' },
    },
    order: {
      ntpID: null,
      posSignature: signature,
      dateTime: new Date().toISOString(),
      description: `Comanda ${orderData.orderNumber} - TechNest`,
      orderID: orderData.orderNumber,
      amount: parseFloat(orderData.total),
      currency: 'RON',
      billing: {
        email: orderData.customerEmail,
        phone: orderData.customerPhone || '',
        firstName: orderData.customerName?.split(' ')[0] || '',
        lastName: orderData.customerName?.split(' ').slice(1).join(' ') || '',
        city: orderData.city || '',
        country: 642,
        state: orderData.county || '',
        postalCode: orderData.postalCode || '',
        details: orderData.address || '',
      },
      shipping: {
        email: orderData.customerEmail,
        phone: orderData.customerPhone || '',
        firstName: orderData.customerName?.split(' ')[0] || '',
        lastName: orderData.customerName?.split(' ').slice(1).join(' ') || '',
        city: orderData.city || '',
        country: 642,
        state: orderData.county || '',
        postalCode: orderData.postalCode || '',
        details: orderData.address || '',
      },
      products: orderData.items || [],
      installments: { selected: 1, available: [1] },
    },
  }

  let r: Response
  try {
    r = await fetch('https://secure.netopia-payments.com/payment/card/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': publicKey },
      body: JSON.stringify(payload),
    })
  } catch (e: any) {
    console.error('Eroare rețea la Netopia:', e)
    return NextResponse.json({ success: false, error: 'Nu s-a putut contacta Netopia. Comanda a fost înregistrată, dar plata cu cardul nu a putut fi inițiată — încearcă din nou sau alege altă metodă de plată.' }, { status: 502 })
  }

  // Netopia poate raspunde uneori cu body gol sau HTML (nu JSON) in caz de eroare de configurare/retea de la ei.
  // Citim ca text si parsam manual, ca sa nu crape aici daca nu e JSON valid.
  const rawText = await r.text()
  let d: any = null
  try { d = rawText ? JSON.parse(rawText) : null } catch {
    console.error('Raspuns Netopia non-JSON:', rawText?.slice(0, 500))
  }

  if (!r.ok || !d?.payment?.paymentURL) {
    return NextResponse.json({ success: false, error: 'Netopia failed', details: d ?? rawText?.slice(0, 500) ?? 'răspuns gol de la Netopia' }, { status: 502 })
  }

  return NextResponse.json({ success: true, paymentUrl: d.payment.paymentURL })
}
