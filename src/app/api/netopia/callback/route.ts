import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const orderID = body?.order?.orderID || body?.orderID
    const status  = body?.order?.status || body?.status

    if (!orderID) return new Response('<?xml version="1.0" encoding="utf-8"?><crc>Missing orderID</crc>', { headers: { 'Content-Type': 'text/xml' } })

    let paymentStatus = 'pending'
    let orderStatus   = 'processing'
    if (status === 3) { paymentStatus = 'paid'; orderStatus = 'processing' }
    else if (status === 5) { paymentStatus = 'failed'; orderStatus = 'cancelled' }

    const supabase = createServiceClient()
    await supabase.from('orders').update({ payment_status: paymentStatus, status: orderStatus, updated_at: new Date().toISOString() }).eq('order_number', orderID)

    return new Response('<?xml version="1.0" encoding="utf-8"?><crc>confirmed</crc>', { headers: { 'Content-Type': 'text/xml' } })
  } catch {
    return new Response('<?xml version="1.0" encoding="utf-8"?><crc>error</crc>', { headers: { 'Content-Type': 'text/xml' } })
  }
}
