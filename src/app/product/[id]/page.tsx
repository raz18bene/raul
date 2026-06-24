'use client'

export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import Link from 'next/link'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [mainImg, setMainImg] = useState('')
  const [added, setAdded] = useState(false)
  const [recommended, setRecommended] = useState<Product[]>([])

  useEffect(() => {
    if (!params.id) return
    supabaseClient().from('products').select('*, categories(name,slug)').eq('id', params.id).single().then(({ data }) => {
      setProduct(data)
      setMainImg(data?.images?.[0] || '')
      setLoading(false)
      if (data?.recommended_ids?.length) {
        supabaseClient().from('products').select('*').in('id', data.recommended_ids).eq('is_active', true).then(({ data: r }) => setRecommended(r || []))
      }
    })
  }, [params.id])

  if (loading) return <div className="loading-state"><div className="spinner" /></div>
  if (!product) return <div className="empty-state"><p>Produsul nu a fost găsit.</p><Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Acasă</Link></div>

  const price = product.sale_price ?? product.price
  const inStock = product.stock > 0
  const lowStock = product.stock > 0 && product.stock <= 10

  function handleAdd() {
    addToCart({ id: product!.id, name: product!.name, price, images: product!.images || [], stock: product!.stock, sku: product!.sku }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        ← Înapoi
      </button>

      <div className="product-page-layout">
        <div className="product-gallery">
          {mainImg ? (
            <img className="main-product-img" src={mainImg} alt={product.name} />
          ) : (
            <div className="main-product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', opacity: 0.3 }}>📦</div>
          )}
          {product.images && product.images.length > 1 && (
            <div className="thumb-row">
              {product.images.map((src, i) => (
                <img key={i} src={src} className={`thumb ${mainImg === src ? 'active' : ''}`} alt="" onClick={() => setMainImg(src)} />
              ))}
            </div>
          )}

          {product.description && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '1rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem' }}>Descriere</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{product.description}</p>
            </div>
          )}

          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '1rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem' }}>Specificații</h3>
              <table className="specs-table">
                <tbody>
                  {Object.entries(product.attributes).map(([k, v]) => (
                    <tr key={k}><td>{k}</td><td>{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <p style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', opacity: 0.8 }}>
            {(product.categories as any)?.name}
          </p>
          <h1 className="product-detail-name">{product.name}</h1>
          {product.sku && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>SKU: {product.sku}</p>}

          <div style={{ marginBottom: '1.25rem' }}>
            <span className="product-detail-price">{price.toFixed(2)} RON</span>
            {product.sale_price && (
              <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '1.1rem', marginLeft: '0.75rem' }}>{product.price.toFixed(2)} RON</span>
            )}
          </div>

          <span className={`stock-badge ${!inStock ? 'stock-out' : lowStock ? 'stock-low' : 'stock-ok'}`} style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
            {!inStock ? 'Stoc Epuizat' : lowStock ? `Stoc Limitat: ${product.stock} buc` : `În Stoc: ${product.stock} buc`}
          </span>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div className="qty-control">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-display">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(q => Math.min(product!.stock, q + 1))}>+</button>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={!inStock}
              style={{ flex: 1, justifyContent: 'center', minWidth: 180, background: added ? 'var(--success)' : undefined }}
            >
              {added ? '✓ Adăugat în Coș!' : '🛒 Adaugă în Coș'}
            </button>
          </div>
        </div>
      </div>

      {recommended.length > 0 && (
        <section style={{ marginTop: '4rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '1.25rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem' }}>
            Produse Recomandate
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {recommended.map(p => {
              const rPrice = p.sale_price ?? p.price
              return (
                <Link key={p.id} href={`/product/${p.id}`} style={{ textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'block', transition: 'transform 0.2s, border-color 0.2s' }}
                  onMouseOver={e => { (e.currentTarget as any).style.transform = 'translateY(-3px)'; (e.currentTarget as any).style.borderColor = 'var(--primary)' }}
                  onMouseOut={e => { (e.currentTarget as any).style.transform = ''; (e.currentTarget as any).style.borderColor = 'var(--border)' }}>
                  {p.images?.[0] && <img src={p.images[0]} alt={p.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />}
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{p.name}</div>
                    <div style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{rPrice.toFixed(2)} RON</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
