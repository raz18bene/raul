import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactează TechNest: telefon 0754 545 800, email technest.prototyping@gmail.com, Timișoara, 3 August 1919, nr. 21.",
  alternates: { canonical: "/contact" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
