import ProductsPage from '@/components/shop/ProductsPage'
import { getCategoryProducts } from '@/lib/catalog-server'

export const dynamic = 'force-dynamic'

export default async function FilamentePage() {
  const initialProducts = await getCategoryProducts('filamente-3d')

  return (
    <ProductsPage
      key="filamente"
      initialProducts={initialProducts}
      categorySlug="filamente-3d"
      title="Filamente 3D PLA, PETG și TPU"
      subtitle="Explorează filamente 3D în diferite materiale și culori pentru proiecte hobby și profesionale. Disponibile online și prin magazinul TechNest din Timișoara."
      seoContent={{ heading: "Cum alegi filamentul potrivit pentru imprimarea 3D?", paragraphs: ["PLA este o opțiune accesibilă pentru modele și prototipuri de interior, iar PETG poate fi potrivit pentru piese funcționale care au nevoie de un echilibru între rezistență și imprimabilitate. TPU este utilizat pentru piese flexibile, în timp ce ASA și ABS sunt alese în funcție de condițiile de utilizare și de capabilitățile imprimantei.","Compară materialul, culoarea, producătorul și diametrul filamentului înainte de comandă. Verifică temperaturile recomandate, necesitatea uscării și compatibilitatea cu imprimanta și cu suprafața de imprimare. Diferitele variante de PLA, PETG sau TPU pot necesita profiluri de imprimare distincte.","TechNest comercializează filamente 3D în magazinul din Timișoara și online. Pentru proiecte pentru care nu dispui de propria imprimantă, poți solicita separat servicii de printare 3D la comandă."] }}
    />
  )
}
