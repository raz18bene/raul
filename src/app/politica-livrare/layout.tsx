import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/politica-livrare",
  "Politica de Livrare",
  "Detalii despre livrarea comenzilor TechNest: curier, termene, costuri și ridicare de la sediu.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
