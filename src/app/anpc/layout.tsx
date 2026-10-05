import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "ANPC",
  description: "Informații ANPC și soluționarea alternativă a litigiilor pentru consumatori.",
  alternates: { canonical: "/anpc" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
