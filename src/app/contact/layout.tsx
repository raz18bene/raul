import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/contact",
  "Contact și magazin în Timișoara",
  "Contactează TechNest Prototyping din Timișoara pentru componente electronice, filamente și printare 3D. Magazin: 3 August 1919 nr. 21, telefon 0754 545 800.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
