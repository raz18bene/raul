import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Termeni și Condiții",
  description: "Termenii și condițiile de utilizare și de achiziție pe TechNest.",
  alternates: { canonical: "/termeni-conditii" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
