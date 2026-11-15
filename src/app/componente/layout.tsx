import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/componente",
  "Componente electronice și Arduino în Timișoara",
  "Descoperă componente electronice în Timișoara la TechNest: senzori Arduino, module, microcontrolere, motoare electrice, Raspberry Pi și accesorii pentru proiectele tale.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
