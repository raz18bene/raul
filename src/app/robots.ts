import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Spune crawlerelor ce au voie sa citeasca. Panoul de admin, contul, cosul si API-urile
// nu trebuie sa apara in Google.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/contact'],
        disallow: ['/admin', '/admin-tutorial', '/api/', '/cont', '/checkout', '/payment-return'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
