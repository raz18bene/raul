import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Piese Imprimante 3D",
  description: "Piese de schimb și consumabile pentru imprimante 3D: duze, hotend-uri, curele, rulmenți, ventilatoare și multe altele.",
  alternates: { canonical: "/accesorii" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
