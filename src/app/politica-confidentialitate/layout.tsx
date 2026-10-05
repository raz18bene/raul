import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Politica de Confidențialitate",
  description: "Cum colectăm, folosim și protejăm datele tale personale pe TechNest.",
  alternates: { canonical: "/politica-confidentialitate" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
