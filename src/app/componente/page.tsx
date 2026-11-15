import ProductsPage from '@/components/shop/ProductsPage'
import { getCategoryProducts } from '@/lib/catalog-server'

export const dynamic = 'force-dynamic'

export default async function ComponentePage() {
  const initialProducts = await getCategoryProducts('componente-electronice')

  return (
    <ProductsPage
      key="componente"
      initialProducts={initialProducts}
      categorySlug="componente-electronice"
      title="Componente Electronice și Arduino în Timișoara"
      subtitle="Plăci compatibile Arduino, senzori, module, motoare și accesorii pentru proiecte electronice. Magazin TechNest în Timișoara și comenzi online."
      seoContent={{ heading: "Ce componente electronice poți alege pentru proiectul tău?", paragraphs: ["În catalog poți căuta plăci de dezvoltare compatibile Arduino și Raspberry Pi, senzori, module, motoare și accesorii. Înainte de comandă, verifică tensiunea de alimentare, interfețele de comunicare și dimensiunile, pentru a alege piese potrivite proiectului tău.","Pentru un prototip, un proiect educațional sau o aplicație de automatizare, componentele electronice pot fi combinate cu suporturi și carcase realizate prin printare 3D. TechNest oferă produse online și are magazin fizic în Timișoara.","Folosește căutarea și filtrele disponibile pentru a compara modelele. Specificațiile afișate pentru fiecare produs sunt mai importante decât denumirea generică a categoriei; pentru întrebări despre compatibilitate, ne poți contacta înainte de cumpărare."] }}
    />
  )
}
