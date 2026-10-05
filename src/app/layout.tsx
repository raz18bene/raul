import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/hooks/useCart'
import { ThemeProvider } from '@/hooks/useTheme'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/ui/CookieBanner'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, BUSINESS } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TechNest — Filamente 3D, Componente Electronice & Piese Imprimante 3D',
    template: '%s | TechNest',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'TechNest — Filamente 3D, Componente Electronice & Piese Imprimante 3D',
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: 'TechNest — Filamente 3D & Componente Electronice', description: SITE_DESCRIPTION },
  // Cod de verificare Google Search Console (optional) — se pune in Vercel ca NEXT_PUBLIC_GOOGLE_VERIFICATION.
  verification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } : undefined,
}

// Date structurate (schema.org) pentru Google: firma + site-ul.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Store',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: BUSINESS.legalName,
      url: SITE_URL,
      telephone: BUSINESS.phone,
      email: BUSINESS.email,
      description: SITE_DESCRIPTION,
      address: {
        '@type': 'PostalAddress',
        streetAddress: BUSINESS.street,
        addressLocality: BUSINESS.city,
        addressRegion: BUSINESS.region,
        addressCountry: BUSINESS.country,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '16:00',
          closes: '22:00',
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'ro-RO',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply theme BEFORE first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('tn_theme');
                if (t === 'light') document.documentElement.classList.add('light-mode');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <ThemeProvider>
          <CartProvider>
            <Navbar />
            <main className="main-content">
              {children}
            </main>
            <Footer />
            <CookieBanner />
            <WhatsAppButton />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
