import ProductsPage from '@/components/shop/ProductsPage'

export default function FilamentePage() {
  return (
    <ProductsPage
      categorySlug="filamente-3d"
      title="Filamente 3D"
      subtitle="Peste 150 de variante premium. Partener oficial Depozitfilament.ro."
      filterMaterials={['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'PLA+', 'Matte']}
    />
  )
}
