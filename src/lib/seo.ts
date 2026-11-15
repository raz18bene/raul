import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from './site'

export function pageMetadata(path: string, title: string, description: string): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'ro_RO', siteName: SITE_NAME,
      url: `${SITE_URL}${path}`, title: socialTitle, description },
    twitter: { card: 'summary', title: socialTitle, description },
  }
}

// Prevent catalog text containing </script> from breaking out of a JSON-LD script.
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function categoryPath(slug?: string): string | undefined {
  return ({
    'filamente-3d': '/filamente',
    'componente-electronice': '/componente',
    accesorii: '/accesorii',
    'piese-imprimante-3d': '/accesorii',
    'print-3d': '/print3d',
  } as Record<string, string>)[slug ?? '']
}

// Values from the existing delivery/return pages; no invented ratings or deadlines.
// Only standard catalog goods use this policy, not custom print requests.
export function offerPolicies(slug: string | undefined, inStock: boolean) {
  if (!['filamente-3d', 'componente-electronice', 'accesorii', 'piese-imprimante-3d'].includes(slug ?? '')) {
    return { shippingDetails: undefined, hasMerchantReturnPolicy: undefined }
  }
  return {
    ...(inStock ? { shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'RO' },
      shippingRate: { '@type': 'MonetaryAmount', value: 20, currency: 'RON' },
      deliveryTime: { '@type': 'ShippingDeliveryTime',
        transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' } },
      shippingSettingsLink: `${SITE_URL}/politica-livrare`,
    } } : {}),
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy', applicableCountry: 'RO',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      merchantReturnLink: `${SITE_URL}/politica-retur`,
      description: 'Retur în 14 zile, în condițiile politicii de retur. Sunt exceptate produsele personalizate și filamentele deschise sau utilizate.',
    },
  }
}
