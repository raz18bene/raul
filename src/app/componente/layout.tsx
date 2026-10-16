import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Componente electronice și Arduino în Timișoara",
  description: "Descoperă componente electronice în Timișoara la TechNest: senzori Arduino, module, microcontrolere, motoare electrice, Raspberry Pi și accesorii pentru proiectele tale.",
  alternates: { canonical: "/componente" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
