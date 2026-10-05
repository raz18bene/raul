import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Filamente 3D",
  description: "Peste 150 de variante de filamente 3D premium: PLA, PETG, ABS, TPU și altele, în toate culorile. Livrare rapidă în toată țara.",
  alternates: { canonical: "/filamente" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
