import type { MetadataRoute } from 'next'
import { publicCatalogClient } from '@/lib/catalog-server'
import { readAllPages } from '@/lib/catalog-pagination'
import { SITE_URL, STATIC_ROUTES } from '@/lib/site'

// A failed refresh throws so ISR can retain the last complete sitemap.
// Never publish a partial HTTP 200 sitemap when a catalog page fails.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = publicCatalogClient()
  const products = await readAllPages<{ id: string }>((from, to) => sb.from('products')
    .select('id').eq('is_active', true).order('id', { ascending: true }).range(from, to))
  return [
    ...STATIC_ROUTES.map(r => ({
      url: `${SITE_URL}${r.path === '/' ? '' : r.path}`,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...products.map(p => ({
      url: `${SITE_URL}/product/${p.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
