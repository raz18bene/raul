'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import ProductCard from './ProductCard'

interface Props {
  categorySlug: string
  title: string
  subtitle?: string
  filterMaterials?: string[]
}

export default function ProductsPage({ categorySlug, title, subtitle, filterMaterials }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [filterAvail, setFilterAvail] = useState('all')
  const [filterMat, setFilterMat] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

      if (!cat) { setLoading(false); return }

      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('category_id', cat.id)
        .eq('is_active', true)

      setProducts(data || [])
      setLoading(false)
    }
    load()
  }, [categorySlug])

  const filtered = useMemo(() => {
    let result = [...products]
    const q = search.toLowerCase()

    if (q) result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
    if (filterAvail === 'in-stock') result = result.filter(p => p.stock > 0)
    if (filterAvail === 'low-stock') result = result.filter(p => p.stock > 0 && p.stock <= 10)
    if (filterMat !== 'all') result = result.filter(p =>
      p.name.toLowerCase().includes(filterMat) ||
      (p.description || '').toLowerCase().includes(filterMat)
    )

    const priceOf = (p: Product) => p.sale_price ?? p.price
    if (sort === 'price-asc') result.sort((a, b) => priceOf(a) - priceOf(b))
    else if (sort === 'price-desc') result.sort((a, b) => priceOf(b) - priceOf(a))
    else if (sort === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name))
    else if (sort === 'stock') result.sort((a, b) => b.stock - a.stock)
    else if (sort === 'featured') result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

    // Out of stock always last
    result.sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0))

    return result
  }, [products, search, sort, filterAvail, filterMat])

  return (
    <>
      <div className="page-header animate-fade-down">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      <div className="filter-bar animate-fade">
        <input
          className="filter-search"
          placeholder="🔍 Caută produs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {filterMaterials && filterMaterials.length > 0 && (
          <select className="filter-select" value={filterMat} onChange={e => setFilterMat(e.target.value)}>
            <option value="all">Material: Toate</option>
            {filterMaterials.map(m => <option key={m} value={m.toLowerCase()}>{m}</option>)}
          </select>
        )}

        <select className="filter-select" value={filterAvail} onChange={e => setFilterAvail(e.target.value)}>
          <option value="all">Disponibilitate: Toate</option>
          <option value="in-stock">În Stoc</option>
          <option value="low-stock">Stoc Limitat</option>
        </select>

        <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="default">Sortare implicită</option>
          <option value="price-asc">Preț: mic → mare</option>
          <option value="price-desc">Preț: mare → mic</option>
          <option value="name-asc">Nume A-Z</option>
          <option value="name-desc">Nume Z-A</option>
          <option value="stock">Stoc disponibil</option>
          <option value="featured">Recomandate primul</option>
        </select>

        <span className="filter-results">
          {!loading && `${filtered.length} produse`}
        </span>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p style={{ color: 'var(--text-secondary)' }}>Se încarcă produsele...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '3rem' }}>📦</span>
          <p>Niciun produs disponibil pentru criteriile selectate.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </>
  )
}
