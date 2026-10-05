import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Product } from '@/types'
import { SITE_URL, SITE_NAME } from '@/lib/site'
import ProductClient from './ProductClient'

// Pagina de produs randata pe server: Google primeste direct titlul, descrierea, pretul si
// datele structurate (JSON-LD) in HTML, fara sa depinda de JavaScript.
export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// cache() ca generateMetadata si pagina sa nu interogheze baza de date de doua ori.
const getProduct = cache(async (id: string): Promise<Product | null> => {
  if (!UUID_RE.test(id)) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const sb = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await sb.from('products').select('*, categories(name,slug)').eq('id', id).maybeSingle()
  return (data as Product) || null
})

function shortText(text: string | undefined, max: number) {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Produs negăsit', robots: { index: false, follow: false } }

  const price = parseFloat(String(product.sale_price ?? product.price ?? 0)) || 0
  const description =
    shortText(product.description, 155) ||
    `Cumpără ${product.name} de la ${SITE_NAME}. Preț: ${price.toFixed(2)} RON. Livrare rapidă în toată țara.`
  const image = product.images?.[0]
  const url = `${SITE_URL}/product/${product.id}`

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.id}` },
    // produsele dezactivate din admin nu trebuie sa ramana in Google
    robots: product.is_active ? undefined : { index: false, follow: false },
    openGraph: {
      type: 'website',
      url,
      title: product.name,
      description,
      siteName: SITE_NAME,
      locale: 'ro_RO',
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: product.name, description, images: image ? [image] : undefined },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const price = parseFloat(String(product.sale_price ?? product.price ?? 0)) || 0
  const brand = (product.attributes as Record<string, string[] | string> | undefined)?.['Producator']
  const brandName = Array.isArray(brand) ? brand[0] : brand

  // Date structurate schema.org/Product: Google le foloseste pentru pret/stoc in rezultate.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: shortText(product.description, 500) || undefined,
    image: product.images?.length ? product.images : undefined,
    sku: product.sku || product.id,
    brand: brandName ? { '@type': 'Brand', name: brandName } : undefined,
    category: product.categories?.name,
    url: `${SITE_URL}/product/${product.id}`,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: 'RON',
      price: price.toFixed(2),
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Acasă', item: SITE_URL },
      ...(product.categories?.slug
        ? [{ '@type': 'ListItem', position: 2, name: product.categories.name, item: `${SITE_URL}/${product.categories.slug === 'filamente-3d' ? 'filamente' : product.categories.slug === 'componente-electronice' ? 'componente' : product.categories.slug === 'print-3d' ? 'print3d' : product.categories.slug}` }]
        : []),
      { '@type': 'ListItem', position: product.categories?.slug ? 3 : 2, name: product.name },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ProductClient productId={product.id} initialProduct={product} />
    </>
  )
}
