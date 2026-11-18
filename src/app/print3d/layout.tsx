import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/print3d",
  "Printare 3D la comandă în Timișoara",
  "Servicii de printare 3D la comandă în Timișoara: prototipuri și piese personalizate. Trimite fișierul 3D și solicită o ofertă adaptată proiectului.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
