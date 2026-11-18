import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/politica-retur",
  "Politica de Retur",
  "Condițiile de retur și rambursare pentru comenzile făcute pe TechNest.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
