export const dynamic = 'force-dynamic'

import ProductsPage from '@/components/shop/ProductsPage'
import { getCategoryProducts } from '@/lib/catalog-server'

export default async function AccesoriiPage() {
  const initialProducts = await getCategoryProducts('accesorii')

  return (
    <ProductsPage
      key="accesorii"
      initialProducts={initialProducts}
      categorySlug="accesorii"
      title="Piese și accesorii pentru imprimante 3D"
      subtitle="Duze, hotend-uri și consumabile pentru întreținerea imprimantelor 3D. Verifică modelul și compatibilitatea piesei înainte de comandă."
      seoContent={{ heading: "Cum verifici compatibilitatea pieselor pentru imprimanta 3D?", paragraphs: ["Duzele, hotend-urile, suprafețele de imprimare și consumabilele diferă în funcție de modelul imprimantei. Înainte de achiziție, compară codul piesei, dimensiunile, materialele compatibile și modul de prindere sau conectare. Două componente cu aspect asemănător nu sunt neapărat interschimbabile.","Pentru componentele extruderului, verifică tipul sistemului de alimentare și temperatura de lucru. Pentru o placă de imprimare, verifică dimensiunile patului și tipul suprafeței. Consultă denumirea și specificațiile produsului, mai ales dacă există mai multe variante pentru aceeași familie de imprimante.","TechNest din Timișoara oferă piese și accesorii pentru imprimante 3D. Dacă nu ești sigur ce componentă îți trebuie, ne poți trimite modelul imprimantei și codul piesei pentru identificare înainte de comandă."] }}
    />
  )
}
