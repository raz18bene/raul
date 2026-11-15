import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/politica-confidentialitate",
  "Politica de Confidențialitate",
  "Cum colectăm, folosim și protejăm datele tale personale pe TechNest.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
