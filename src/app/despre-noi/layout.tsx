import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/despre-noi",
  "Despre Noi",
  "Află cine suntem: TechNest Prototyping, furnizor de filamente 3D, componente electronice și servicii de fabricație digitală din Timișoara.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
