import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Politica de Livrare",
  description: "Detalii despre livrarea comenzilor TechNest: curier, termene, costuri și ridicare de la sediu.",
  alternates: { canonical: "/politica-livrare" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
