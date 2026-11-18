import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/termeni-conditii",
  "Termeni și Condiții",
  "Termenii și condițiile de utilizare și de achiziție pe TechNest.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
