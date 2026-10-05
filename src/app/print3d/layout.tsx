import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Print 3D Custom",
  description: "Printare 3D la comandă în 24-48h. Trimite fișierul tău și primești ofertă personalizată de la TechNest.",
  alternates: { canonical: "/print3d" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
