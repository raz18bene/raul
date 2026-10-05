import type { Metadata } from 'next'

// Pagina privata: nu trebuie indexata de Google.
export const metadata: Metadata = {
  title: "Contul meu",
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
