import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/anpc",
  "Protecția consumatorilor – ANPC",
  "Informații ANPC și soluționarea alternativă a litigiilor pentru consumatori.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
