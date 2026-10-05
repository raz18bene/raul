import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Politica de Retur",
  description: "Condițiile de retur și rambursare pentru comenzile făcute pe TechNest.",
  alternates: { canonical: "/politica-retur" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
