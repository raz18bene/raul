import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL, STATIC_ROUTES } from '@/lib/site'

// Sitemap generat automat: paginile fixe + TOATE produsele active din Supabase.
// Se reface la cel mult o ora, deci produsele noi adaugate din admin apar singure.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => ({
    url: `${SITE_URL}${r.path === '/' ? '' : r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return entries
    const sb = createClient(url, key, { auth: { persistSession: false } })

    // Supabase intoarce max 1000 randuri per cerere, deci citim pe pagini.
    const pageSize = 1000
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await sb
        .from('products')
        .select('id, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1)
      if (error || !data || data.length === 0) break
      for (const p of data) {
        entries.push({
          url: `${SITE_URL}/product/${p.id}`,
          lastModified: p.created_at ? new Date(p.created_at) : now,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
      if (data.length < pageSize) break
    }
  } catch (e) {
    // Daca baza de date nu raspunde, tot servim sitemap-ul cu paginile fixe.
    console.error('Sitemap: nu am putut citi produsele:', e)
  }

  return entries
}
