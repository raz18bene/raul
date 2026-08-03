'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { Product } from '@/types'
import ProductCard from './ProductCard'

interface Props {
  categorySlug: string
  title: string
  subtitle?: string
}

export default function ProductsPage({ categorySlug, title, subtitle }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [filterAvail, setFilterAvail] = useState('all')
  // Dynamic attribute filters: { "Culoare": "Alb" }
  const [attrFilters, setAttrFilters] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      const sb = supabaseClient()
      const { data: cat } = await sb
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

      if (!cat) { setLoading(false); return }

      const { data } = await sb
        .from('products')
        .select('*, categories(name, slug)')
        .eq('category_id', cat.id)
        .eq('is_active', true)

      setProducts(data || [])
      setLoading(false)
    }
    load()
  }, [categorySlug])

  // Build available attribute keys+values from all products
  const availableAttrs = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    products.forEach(p => {
      if (!p.attributes) return
      Object.entries(p.attributes as Record<string, string>).forEach(([k, v]) => {
        if (!map[k]) map[k] = new Set()
        map[k].add(v)
      })
    })
    // Convert to sorted arrays, only keys with >1 unique value
    const result: Record<string, string[]> = {}
    Object.entries(map).forEach(([k, vs]) => {
      if (vs.size >= 1) result[k] = Array.from(vs).sort()
    })
    return result
  }, [products])

  const filtered = useMemo(() => {
    let result = [...products]
    const q = search.toLowerCase()

    if (q) result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
    if (filterAvail === 'in-stock') result = result.filter(p => p.stock > 0)
    if (filterAvail === 'low-stock') result = result.filter(p => p.stock > 0 && p.stock <= 4)

    // Apply each attribute filter
    Object.entries(attrFilters).forEach(([key, val]) => {
      if (!val) return
      result = result.filter(p => {
        const attrs = p.attributes as Record<string, string> | null
        return attrs && attrs[key] === val
      })
    })

    const priceOf = (p: Product) => parseFloat(String(p.sale_price ?? p.price ?? 0)) || 0
    const stockOf = (p: Product) => parseFloat(String(p.stock ?? 0)) || 0

    if (sort === 'price-asc')  result.sort((a, b) => priceOf(a) - priceOf(b))
    if (sort === 'price-desc') result.sort((a, b) => priceOf(b) - priceOf(a))
    if (sort === 'name-asc')   result.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'name-desc')  result.sort((a, b) => b.name.localeCompare(a.name))
    if (sort === 'stock')      result.sort((a, b) => stockOf(b) - stockOf(a))
    if (sort === 'featured')   result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

    // Out of stock always last
    result.sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0))
    return result
  }, [products, search, sort, filterAvail, attrFilters])

  function setAttrFilter(key: string, val: string) {
    setAttrFilters(prev => ({ ...prev, [key]: prev[key] === val ? '' : val }))
  }

  function clearAllFilters() {
    setSearch('')
    setSort('default')
    setFilterAvail('all')
    setAttrFilters({})
  }

  const hasActiveFilters = search || sort !== 'default' || filterAvail !== 'all' || Object.values(attrFilters).some(Boolean)
  const attrKeys = Object.keys(availableAttrs)

  return (
    <>
      <div className="page-header animate-fade-down">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {/* Search + Sort bar */}
      <div className="filter-bar animate-fade" style={{ gap: '0.75rem', alignItems: 'center' }}>
        <input
          className="filter-search"
          placeholder="🔍 Caută produs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterAvail} onChange={e => setFilterAvail(e.target.value)}>
          <option value="all">Disponibilitate</option>
          <option value="in-stock">În Stoc</option>
          <option value="low-stock">Stoc Limitat</option>
        </select>
        <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="default">Sortare</option>
          <option value="price-asc">Preț ↑</option>
          <option value="price-desc">Preț ↓</option>
          <option value="name-asc">A → Z</option>
          <option value="name-desc">Z → A</option>
          <option value="featured">Recomandate</option>
          <option value="stock">Stoc</option>
        </select>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            style={{ padding: '0.5rem 0.9rem', background: 'rgba(245,101,101,0.12)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            ✕ Reset
          </button>
        )}
        <span className="filter-results">
          {!loading && `${filtered.length} produse`}
        </span>
      </div>

      {/* Dynamic attribute filters — chips */}
      {!loading && attrKeys.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {attrKeys.map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 80 }}>
                {key}:
              </span>
              {availableAttrs[key].map(val => {
                const active = attrFilters[key] === val
                const isColor = key.toLowerCase().includes('culoare') || key.toLowerCase().includes('color')
                const colorMap: Record<string, string> = {
                  'alb': '#ffffff', 'negru': '#1a1a1a', 'roșu': '#ef4444', 'rosu': '#ef4444',
                  'albastru': '#3b82f6', 'verde': '#22c55e', 'galben': '#eab308',
                  'portocaliu': '#f97316', 'roz': '#ec4899', 'violet': '#a855f7',
                  'gri': '#9ca3af', 'maro': '#92400e', 'bej': '#d6c5a0', 'auriu': '#f59e0b',
                  'transparent': 'transparent', 'silver': '#e2e8f0', 'argintiu': '#e2e8f0',
                }
                const bgColor = isColor ? (colorMap[val.toLowerCase()] || null) : null

                return (
                  <button
                    key={val}
                    onClick={() => setAttrFilter(key, val)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: bgColor ? '0.3rem 0.7rem' : '0.35rem 0.85rem',
                      borderRadius: 20,
                      border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: active ? 'var(--bg-hover)' : 'var(--bg-input)',
                      color: active ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: active ? 700 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {bgColor && (
                      <span style={{
                        width: 14, height: 14, borderRadius: '50%',
                        background: bgColor,
                        border: val.toLowerCase() === 'alb' || val.toLowerCase() === 'transparent' ? '1px solid var(--border)' : 'none',
                        flexShrink: 0,
                      }} />
                    )}
                    {val}
                    {active && ' ✓'}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '3rem' }}>📦</span>
          <p>Niciun produs pentru criteriile selectate.</p>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
              Resetează filtrele
            </button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </>
  )
}
