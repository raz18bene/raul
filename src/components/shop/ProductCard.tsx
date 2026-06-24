'use client'
import { Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const price = parseFloat(String(product.sale_price ?? product.price ?? 0)) || 0
  const inStock = (product.stock ?? 0) > 0
  const lowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 10
  const img = product.images?.[0]

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (!inStock) return
    addToCart({
      id: product.id,
      name: product.name,
      price,
      images: product.images || [],
      stock: product.stock,
      sku: product.sku,
    }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function changeQty(e: React.MouseEvent, delta: number) {
    e.stopPropagation()
    setQty(q => Math.max(1, Math.min(product.stock, q + delta)))
  }

  return (
    <div
      className="product-card"
      onClick={() => router.push(`/product/${product.id}`)}
      style={!inStock ? { opacity: 0.65 } : {}}
    >
      <div className="product-image-wrap">
        {img ? (
          <img src={img} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-img-placeholder">📦</span>
        )}
      </div>
      <div className="product-info">
        <div className="product-category-badge">
          {product.categories?.name || ''}
        </div>
        <h3 className="product-name">{product.name}</h3>
        {product.description && (
          <p className="product-desc">{product.description}</p>
        )}
        <div className="product-price-row">
          <span className="product-price">{price.toFixed(2)} RON</span>
          {product.sale_price && (
            <span className="product-price-original">{parseFloat(String(product.price ?? 0)).toFixed(2)} RON</span>
          )}
        </div>

        <span className={`stock-badge ${!inStock ? 'stock-out' : lowStock ? 'stock-low' : 'stock-ok'}`}>
          {!inStock ? 'Stoc Epuizat' : lowStock ? `Stoc Limitat: ${product.stock} buc` : `În Stoc: ${product.stock} buc`}
        </span>

        <div className="product-actions">
          <div className="qty-control" onClick={e => e.stopPropagation()}>
            <button className="qty-btn" onClick={e => changeQty(e, -1)}>−</button>
            <span className="qty-display">{qty}</span>
            <button className="qty-btn" onClick={e => changeQty(e, 1)}>+</button>
          </div>
          <button
            className="add-to-cart-btn"
            onClick={handleAdd}
            disabled={!inStock}
            style={added ? { background: '#48bb78', color: '#fff' } : {}}
          >
            {added ? '✓ Adăugat!' : '🛒 Adaugă'}
          </button>
        </div>
      </div>
    </div>
  )
}
