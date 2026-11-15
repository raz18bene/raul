import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata(
  "/filamente",
  "Filamente 3D PLA, PETG, TPU și ABS în Timișoara",
  "Descoperă filamente 3D PLA, PETG, TPU și ABS la TechNest Timișoara. Compară materiale și culori pentru imprimanta ta. Comenzi online și livrare în România.",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
