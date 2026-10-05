import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Despre Noi",
  description: "Află cine suntem: TechNest Prototyping, furnizor de filamente 3D, componente electronice și servicii de fabricație digitală din Timișoara.",
  alternates: { canonical: "/despre-noi" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
