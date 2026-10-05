// Setari centrale pentru SEO. Domeniul public principal al site-ului (fara slash la final).
// Poate fi suprascris din Vercel cu NEXT_PUBLIC_SITE_URL, dar implicit e domeniul final.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.technestprototyping.ro').replace(/\/$/, '')

export const SITE_NAME = 'TechNest'
export const SITE_DESCRIPTION =
  'TechNest Prototyping — filamente 3D premium, componente electronice, piese de schimb pentru imprimante 3D și servicii de printare 3D la comandă. Livrare rapidă în toată țara din Timișoara.'

export const BUSINESS = {
  legalName: 'TECHNEST PROTOTYPING S.R.L.',
  phone: '+40754545800',
  email: 'technest.prototyping@gmail.com',
  street: '3 August 1919, nr. 21',
  city: 'Timișoara',
  region: 'Timiș',
  country: 'RO',
}

// Pagini publice indexabile (pentru sitemap). priority/changeFrequency sunt doar indicii pentru Google.
export const STATIC_ROUTES: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/filamente', priority: 0.9, changeFrequency: 'daily' },
  { path: '/componente', priority: 0.9, changeFrequency: 'daily' },
  { path: '/accesorii', priority: 0.9, changeFrequency: 'daily' },
  { path: '/print3d', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/despre-noi', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/politica-livrare', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/politica-retur', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/politica-confidentialitate', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/politica-gdpr', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/termeni-conditii', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/anpc', priority: 0.3, changeFrequency: 'yearly' },
]
