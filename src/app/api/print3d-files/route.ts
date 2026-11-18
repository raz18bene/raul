export const dynamic = 'force-dynamic'
import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { ApiError, apiError, jsonBody, requireAdmin, textField } from '@/lib/api-security'
import { PRINT_BUCKET, MAX_PRINT_FILE, validPrintPath, attachmentProof } from '@/lib/private-files'

export async function POST(req: Request) {
  try {
    const body = await jsonBody(req)
    const name = textField(body.name, 180, true).replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${randomUUID()}/${name}`
    if (!validPrintPath(path) || !Number.isSafeInteger(body.size) || body.size <= 0 || body.size > MAX_PRINT_FILE) throw new ApiError(400, 'Fișier invalid sau mai mare de 50 MB.')
    const proof = attachmentProof(path, Date.now() + 24 * 3600000)
    const sb = createServiceClient()
    const bucket = await sb.storage.getBucket(PRINT_BUCKET)
    if (bucket.error || !bucket.data || bucket.data.public || Number(bucket.data.file_size_limit) > MAX_PRINT_FILE || !bucket.data.file_size_limit) throw new ApiError(503, 'Spațiul privat de încărcare nu este disponibil.')
    const result = await sb.storage.from(PRINT_BUCKET).createSignedUploadUrl(path, { upsert: false })
    if (result.error || !result.data) throw new ApiError(503, 'Încărcarea nu a putut fi pregătită.')
    return NextResponse.json({ path, token: result.data.token, proof }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
export async function GET(req: Request) {
  try {
    await requireAdmin(req)
    const path = new URL(req.url).searchParams.get('path')
    if (!validPrintPath(path)) throw new ApiError(400, 'Fișier invalid.')
    const sb = createServiceClient()
    const bucket = await sb.storage.getBucket(PRINT_BUCKET)
    if (bucket.error || !bucket.data || bucket.data.public) throw new ApiError(503, 'Spațiul privat nu este disponibil.')
    const result = await sb.storage.from(PRINT_BUCKET).createSignedUrl(path, 60, { download: true })
    if (result.error || !result.data) throw new ApiError(404, 'Fișier indisponibil.')
    return NextResponse.json({ url: result.data.signedUrl }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
