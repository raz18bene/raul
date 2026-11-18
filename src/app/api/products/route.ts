export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase'
import { apiError, ApiError, jsonBody, requireAdmin, UUID, textField } from '@/lib/api-security'
import { money } from '@/lib/checkout'

function productFields(raw: Record<string, any>) {
  const allowed = ['name','description','price','sale_price','stock','sku','category_id','images','attributes','is_active','featured']
  const out = Object.fromEntries(Object.entries(raw).filter(([key]) => allowed.includes(key)))
  if ('name' in out) out.name = textField(out.name, 300, true)
  for (const k of ['price','sale_price']) if (out[k] != null) money(out[k])
  if ('stock' in out && (!Number.isSafeInteger(out.stock) || out.stock < 0)) throw new ApiError(400, 'Stoc invalid.')
  if (out.category_id != null && !UUID.test(out.category_id)) throw new ApiError(400, 'Categorie invalidă.')
  return out
}
export async function GET(req: Request) {
  try {
    const categoryId = new URL(req.url).searchParams.get('categoryId')
    if (categoryId && !UUID.test(categoryId)) throw new ApiError(400, 'Categorie invalidă.')
    // Public reading never uses the service-role credential.
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
    let query = sb.from('products').select('*, categories(name, slug)').eq('is_active', true)
    if (categoryId) query = query.eq('category_id', categoryId)
    const { data, error } = await query.order('name')
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) { return apiError(error) }
}
export async function POST(req: Request) {
  try {
    await requireAdmin(req)
    const body = productFields(await jsonBody(req))
    if (!body.name || body.price == null) throw new ApiError(400, 'Nume și preț obligatorii.')
    const { data, error } = await createServiceClient().from('products').insert(body).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) { return apiError(error) }
}
export async function PUT(req: Request) {
  try {
    await requireAdmin(req)
    const body = await jsonBody(req)
    if (typeof body.id !== 'string' || !UUID.test(body.id)) throw new ApiError(400, 'ID invalid.')
    const { data, error } = await createServiceClient().from('products').update(productFields(body)).eq('id', body.id).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) { return apiError(error) }
}
export async function DELETE(req: Request) {
  try {
    await requireAdmin(req)
    const { id } = await jsonBody(req)
    if (typeof id !== 'string' || !UUID.test(id)) throw new ApiError(400, 'ID invalid.')
    const { error } = await createServiceClient().from('products').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) { return apiError(error) }
}
