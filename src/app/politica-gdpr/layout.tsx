import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Politica GDPR",
  description: "Informații despre prelucrarea datelor cu caracter personal conform GDPR pe TechNest.",
  alternates: { canonical: "/politica-gdpr" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
