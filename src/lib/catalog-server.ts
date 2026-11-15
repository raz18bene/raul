import { createClient } from '@supabase/supabase-js'
import type { Product } from '@/types'
import { readAllPages } from './catalog-pagination'

// Public read-only credentials, never the service-role key.
export function publicCatalogClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Public catalog configuration missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function getCategoryProducts(categorySlug: string): Promise<Product[]> {
  const sb = publicCatalogClient()
  const { data: category, error } = await sb.from('categories')
    .select('id').eq('slug', categorySlug).maybeSingle()
  if (error || !category) throw new Error('Category query failed')
  // Do not turn an outage into a successful empty catalog for crawlers.
  return readAllPages<Product>((from, to) => sb.from('products')
    .select('*, categories(name, slug)').eq('category_id', category.id)
    .eq('is_active', true).order('id', { ascending: true }).range(from, to))
}
