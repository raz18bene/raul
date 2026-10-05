import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Componente Electronice",
  description: "Componente electronice de calitate, compatibile Arduino, Raspberry Pi și altele: senzori, module, microcontrolere, motoare și accesorii.",
  alternates: { canonical: "/componente" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
