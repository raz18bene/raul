import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/politica-gdpr",
  "Politica GDPR",
  "Informații despre prelucrarea datelor cu caracter personal conform GDPR pe TechNest.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
