import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/accesorii",
  "Piese și accesorii pentru imprimante 3D",
  "Caută piese pentru imprimante 3D la TechNest Timișoara: duze, hotend-uri și consumabile. Verifică modelele compatibile și comandă online.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
