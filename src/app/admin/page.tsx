'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef, useMemo } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Product, Order } from '@/types'

function useSupabase() {
  const ref = useRef<SupabaseClient | null>(null)
  if (typeof window !== 'undefined' && !ref.current) {
    const { getSupabase } = require('@/lib/supabase')
    ref.current = getSupabase()
  }
  return ref.current
}

const safe = (v: any) => parseFloat(String(v ?? 0)) || 0


// ─── Image Uploader ───────────────────────────────────────────────
function ImageUploader({ images, onChange, sb }: { images: string[], onChange: (imgs: string[]) => void, sb: any }) {
  const [uploading, setUploading] = useState(false)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const newUrls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await sb.storage.from('products').upload(path, file, { cacheControl: '3600', upsert: false })
      if (!error && data) {
        const { data: url } = sb.storage.from('products').getPublicUrl(path)
        newUrls.push(url.publicUrl)
      }
    }
    onChange([...images, ...newUrls])
    setUploading(false)
    e.target.value = ''
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {/* Preview grid */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {images.map((url, idx) => (
            <div key={idx} style={{ position: 'relative', width: 80, height: 80 }}>
              <img src={url} alt={`img${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--border)' }} />
              {idx === 0 && <span style={{ position: 'absolute', top: 2, left: 2, background: 'var(--primary)', color: '#000', fontSize: '0.6rem', fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>MAIN</span>}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--error)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
      {/* Upload button */}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--bg-hover)', border: '2px dashed var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.88rem', transition: 'border-color 0.2s', width: '100%', justifyContent: 'center' }}>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={handleFiles} />
        {uploading ? '⏳ Se încarcă...' : '📷 Adaugă poze (JPG, PNG, WEBP)'}
      </label>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Prima poză = poza principală · Recomandare: 800×800px</p>
    </div>
  )
}

// ─── Product Modal ────────────────────────────────────────────────
function ProductModal({ product, categories, onSave, onClose, sb }: {
  product: any, categories: any[], onSave: () => void, onClose: () => void, sb: SupabaseClient
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    sale_price: product?.sale_price || '',
    stock: product?.stock || 0,
    sku: product?.sku || '',
    category_id: product?.category_id || categories[0]?.id || '',
    is_active: product?.is_active ?? true,
    featured: product?.featured || false,
    attributes: product?.attributes ? JSON.stringify(product.attributes, null, 2) : '{}',
  })
  const [images, setImages] = useState<string[]>(product?.images || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    let attrs = {}
    try { attrs = JSON.parse(form.attributes) } catch { setError('Atribute JSON invalid'); setSaving(false); return }

    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(String(form.price)),
      sale_price: form.sale_price ? parseFloat(String(form.sale_price)) : null,
      stock: parseInt(String(form.stock)),
      sku: form.sku || null,
      category_id: form.category_id,
      is_active: form.is_active,
      featured: form.featured,
      attributes: attrs,
      images: images,
    }

    const { error: err } = product?.id
      ? await sb.from('products').update(data).eq('id', product.id)
      : await sb.from('products').insert({ ...data, images: [] })

    if (err) { setError(err.message); setSaving(false); return }
    onSave()
  }

  const inp = (label: string, key: string, type = 'text', props: any = {}) => (
    <div className="form-group">
      <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', width: '100%', outline: 'none' }}
        {...props}
      />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.2rem' }}>
            {product?.id ? '✏️ Editează Produs' : '➕ Produs Nou'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {inp('Nume Produs *', 'name', 'text', { required: true })}
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Descriere</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', width: '100%', resize: 'vertical', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {inp('Preț (RON) *', 'price', 'number', { required: true, step: '0.01', min: '0' })}
            {inp('Preț Redus (RON)', 'sale_price', 'number', { step: '0.01', min: '0' })}
            {inp('Stoc *', 'stock', 'number', { required: true, min: '0' })}
            {inp('SKU', 'sku')}
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Categorie</label>
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', width: '100%' }}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Poze Produs</label>
            <ImageUploader images={images} onChange={setImages} sb={sb} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Atribute (JSON) — ex: {`{"Material":"PLA","Culoare":"Alb"}`}</label>
            <textarea
              value={form.attributes}
              onChange={e => setForm(f => ({ ...f, attributes: e.target.value }))}
              rows={3}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.82rem', fontFamily: 'monospace', width: '100%', resize: 'vertical', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Activ
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
              Recomandat
            </label>
          </div>
          {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.7rem', background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Anul</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.7rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {saving ? '⏳ Se salvează...' : '💾 Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Order Detail Modal ───────────────────────────────────────────
function OrderModal({ order, onClose, onUpdate, sb }: { order: any, onClose: () => void, onUpdate: () => void, sb: SupabaseClient }) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [saving, setSaving] = useState(false)
  const [awbLoading, setAwbLoading] = useState(false)

  async function saveChanges() {
    setSaving(true)
    await sb.from('orders').update({ status, payment_status: paymentStatus }).eq('id', order.id)
    setSaving(false)
    onUpdate()
  }

  async function generateAWB() {
    setAwbLoading(true)
    const addr = order.shipping_address || {}
    const r = await fetch('/api/sameday', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-awb',
        orderNumber: order.order_number,
        recipientName: order.customer_name,
        recipientPhone: order.customer_phone,
        recipientEmail: order.customer_email,
        recipientAddress: addr.street || '',
        recipientCity: addr.city || '',
        recipientCounty: addr.county || '',
        recipientPostalCode: addr.postal_code || '',
        weight: 1, parcels: 1, cashOnDelivery: 0,
      }),
    })
    const d = await r.json()
    if (d.success) {
      await sb.from('orders').update({ awb_number: d.awbNumber, status: 'shipped' } as any).eq('id', order.id)
      alert(`✅ AWB generat: ${d.awbNumber}`)
      onUpdate()
    } else {
      alert('❌ ' + JSON.stringify(d.details || d.error))
    }
    setAwbLoading(false)
  }

  const addr = order.shipping_address || {}
  const statusColors: Record<string, string> = { pending: '#ed8936', processing: '#00d9ff', shipped: '#48bb78', delivered: '#48bb78', cancelled: '#f56565' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.2rem' }}>{order.order_number}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(order.created_at).toLocaleString('ro-RO')}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Client info */}
        <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>👤 {order.customer_name}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>📧 {order.customer_email}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>📞 {order.customer_phone}</p>
          {addr.street && <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.3rem' }}>📍 {addr.street}, {addr.city}, {addr.county} {addr.postal_code}</p>}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>🚚 {order.shipping_method === 'sediu' ? 'Ridicare de la sediu' : 'SameDay Courier'} · 💳 {order.payment_method}</p>
        </div>

        {/* Products */}
        {order.order_items?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produse</p>
            {order.order_items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>{item.product_name} <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span></span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{safe(item.total_price).toFixed(2)} RON</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total</span>
              <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{safe(order.total_amount).toFixed(2)} RON</span>
            </div>
          </div>
        )}

        {/* Status controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status Comandă</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: statusColors[status] || 'var(--text-primary)', border: `1px solid ${statusColors[status] || 'var(--border)'}`, borderRadius: 8, fontSize: '0.9rem', width: '100%', fontWeight: 600 }}>
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status Plată</label>
            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', width: '100%' }}>
              {['pending', 'paid', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* AWB */}
        {(order as any).awb_number ? (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(72,187,120,0.1)', border: '1px solid var(--success)', borderRadius: 8, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>🏷️ AWB: {(order as any).awb_number}</span>
            <a href={`https://sameday.ro/tracking?awb=${(order as any).awb_number}`} target="_blank" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>Track →</a>
          </div>
        ) : order.shipping_method !== 'sediu' ? (
          <button onClick={generateAWB} disabled={awbLoading}
            style={{ width: '100%', padding: '0.75rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' }}>
            {awbLoading ? '⏳ Se generează...' : '🚚 Generează AWB SameDay'}
          </button>
        ) : (
          <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 8, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            🏢 Ridicare de la sediu — fără AWB
          </div>
        )}

        {order.notes && (
          <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 8, marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Note:</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{order.notes}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.7rem', background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Închide</button>
          <button onClick={saveChanges} disabled={saving} style={{ flex: 2, padding: '0.7rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {saving ? '⏳...' : '💾 Salvează Modificările'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────
export default function AdminPage() {
  const sb = useSupabase()
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [tab, setTab] = useState<'products' | 'orders' | 'contact' | 'filtre'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [editProduct, setEditProduct] = useState<any>(null)
  const [editOrder, setEditOrder] = useState<any>(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  useEffect(() => {
    if (!sb) return
    sb.auth.getSession().then(({ data }: any) => {
      if (data.session) checkAdminRole(data.session.user)
    })
  }, [sb])

  async function checkAdminRole(user: any) {
    const role = user?.app_metadata?.role || user?.user_metadata?.role
    if (role === 'admin') { setAuthed(true); loadData() }
    else { await sb!.auth.signOut(); setLoginErr('Nu ai permisiuni de admin.') }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginErr('')
    if (!sb) return
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) { setLoginErr(error.message); return }
    if (data.user) checkAdminRole(data.user)
  }

  async function loadData() {
    if (!sb) return
    setLoading(true)
    const [{ data: prods }, { data: ords }, { data: cats }] = await Promise.all([
      sb.from('products').select('*, categories(name,slug)').order('name'),
      sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      sb.from('categories').select('*').order('name'),
    ])
    setProducts(prods || [])
    setOrders(ords || [])
    setCategories(cats || [])
    setLoading(false)
  }

  async function deleteProduct(id: string) {
    if (!confirm('Sigur vrei să ștergi acest produs?')) return
    await sb!.from('products').delete().eq('id', id)
    loadData()
  }

  async function syncStock() {
    setSyncMsg('⏳ Se sincronizează...')
    const r = await fetch('/api/oblio?action=sync-stock')
    const d = await r.json()
    setSyncMsg(d.success ? `✅ ${d.updated_count} produse actualizate din ${d.total_oblio} în Oblio` : '❌ ' + (d.error || 'Eroare'))
    if (d.success) loadData()
  }

  // Filtered products
  const filteredProducts = products.filter(p => {
    const q = productSearch.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
    const matchFilter = productFilter === 'all' || (productFilter === 'active' && p.is_active) || (productFilter === 'inactive' && !p.is_active) || (productFilter === 'low' && p.stock <= 10 && p.stock > 0) || (productFilter === 'out' && p.stock <= 0)
    return matchSearch && matchFilter
  })

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const q = orderSearch.toLowerCase()
    const matchSearch = !q || o.order_number.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.customer_email.toLowerCase().includes(q)
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter
    return matchSearch && matchStatus
  })

  const statusColors: Record<string, string> = { pending: '#ed8936', processing: '#00d9ff', shipped: '#48bb78', delivered: '#48bb78', cancelled: '#f56565' }

  if (!authed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '1.5rem' }}>Admin Login</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group"><label>Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@admin.ro" /></div>
          <div className="form-group"><label>Parolă</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
          {loginErr && <p style={{ color: 'var(--error)', fontSize: '0.88rem' }}>{loginErr}</p>}
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Intră în Admin</button>
        </form>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.5rem' }}>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a href="/admin-tutorial" target="_blank" className="btn btn-secondary btn-sm">📖 Tutorial Filtre</a>
          <button className="btn btn-secondary btn-sm" onClick={syncStock}>🔄 Sync Oblio</button>
          <button className="btn btn-secondary btn-sm" onClick={async () => {
            const [s, o] = await Promise.all([fetch('/api/sameday?action=test'), fetch('/api/oblio?action=test')])
            const [sd, od] = await Promise.all([s.json(), o.json()])
            alert(`SameDay: ${sd.ok ? '✅' : '❌ ' + sd.error}\nOblio: ${od.ok ? '✅' : '❌ ' + od.error}`)
          }}>🔧 Test Integrări</button>
          <button onClick={() => { sb!.auth.signOut(); setAuthed(false) }}
            style={{ padding: '0.5rem 1rem', background: 'var(--error)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' }}>
            🚪 Ieși
          </button>
        </div>
      </div>

      {syncMsg && <p style={{ marginBottom: '1rem', color: syncMsg.includes('✅') ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{syncMsg}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        {(['products', 'orders', 'contact', 'filtre'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem',
            padding: '0.5rem 1.25rem', border: 'none', borderRadius: 8, cursor: 'pointer',
            background: tab === t ? 'var(--primary)' : 'var(--bg-input)',
            color: tab === t ? '#000' : 'var(--text-secondary)',
          }}>
            {t === 'products' ? `📦 Produse (${products.length})` : t === 'orders' ? `🛒 Comenzi (${orders.length})` : t === 'contact' ? '📩 Cereri' : '🏷️ Filtre'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : tab === 'products' ? (
        <div>
          {/* Product toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="🔍 Caută după nume sau SKU..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }}
            />
            <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.88rem' }}>
              <option value="all">Toate ({products.length})</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="low">Stoc Scăzut (≤10)</option>
              <option value="out">Stoc Epuizat</option>
            </select>
            <button onClick={() => setEditProduct({})}
              style={{ padding: '0.6rem 1rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
              ➕ Produs Nou
            </button>
          </div>

          {/* Products table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Produs</th><th>Categorie</th><th>Preț</th><th>Stoc</th><th>SKU</th><th>Status</th><th>Acțiuni</th></tr></thead>
              <tbody>
                {filteredProducts.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      {p.featured && <span style={{ fontSize: '0.7rem', background: 'rgba(0,217,255,0.15)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>⭐ Recomandat</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.categories?.name || '-'}</td>
                    <td style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      {safe(p.sale_price ?? p.price).toFixed(2)} RON
                      {p.sale_price && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{safe(p.price).toFixed(2)} RON</span>}
                    </td>
                    <td>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, background: p.stock <= 0 ? 'rgba(245,101,101,0.15)' : p.stock <= 10 ? 'rgba(237,137,54,0.15)' : 'rgba(72,187,120,0.15)', color: p.stock <= 0 ? 'var(--error)' : p.stock <= 10 ? 'var(--warning)' : 'var(--success)' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.sku || '-'}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: p.is_active ? 'var(--success)' : 'var(--error)' }}>{p.is_active ? '✓ Activ' : '✗ Inactiv'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => setEditProduct(p)} style={{ padding: '0.3rem 0.6rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>✏️</button>
                        <button onClick={() => deleteProduct(p.id)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(245,101,101,0.15)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Niciun produs găsit</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'orders' ? (
        <div>
          {/* Orders toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              placeholder="🔍 Caută după nr. comandă, client, email..."
              value={orderSearch}
              onChange={e => setOrderSearch(e.target.value)}
              style={{ flex: 1, minWidth: 220, padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }}
            />
            <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.88rem' }}>
              <option value="all">Toate statusurile</option>
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Orders list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredOrders.map((o: any) => (
              <div key={o.id} className="card" style={{ padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onClick={() => setEditOrder(o)}
                onMouseOver={e => (e.currentTarget as any).style.borderColor = 'var(--primary)'}
                onMouseOut={e => (e.currentTarget as any).style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>{o.order_number}</span>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, background: (statusColors[o.status] || '#718096') + '22', color: statusColors[o.status] || '#718096' }}>{o.status}</span>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: 5, fontSize: '0.75rem', background: o.payment_status === 'paid' ? 'rgba(72,187,120,0.15)' : 'rgba(237,137,54,0.15)', color: o.payment_status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>{o.payment_status}</span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.3rem' }}>{o.customer_name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{o.customer_email} · {o.customer_phone}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>{safe(o.total_amount).toFixed(2)} RON</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(o.created_at).toLocaleDateString('ro-RO')}</p>
                    {(o as any).awb_number && <p style={{ color: 'var(--success)', fontSize: '0.78rem' }}>🏷️ {(o as any).awb_number}</p>}
                  </div>
                </div>
                {o.order_items?.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {o.order_items.map((item: any) => (
                      <span key={item.id} style={{ padding: '0.15rem 0.5rem', background: 'var(--bg-input)', borderRadius: 5, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.product_name} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nicio comandă găsită</div>
            )}
          </div>
        </div>
      ) : tab === 'contact' ? (
        <ContactRequests sb={sb!} />
      ) : null}

      {tab === 'filtre' && sb && <FiltrePage sb={sb!} products={products} onRefresh={loadData} />}

      {/* Modals */}
      {editProduct !== null && (
        <ProductModal
          product={editProduct?.id ? editProduct : null}
          categories={categories}
          sb={sb!}
          onSave={() => { setEditProduct(null); loadData() }}
          onClose={() => setEditProduct(null)}
        />
      )}
      {editOrder && (
        <OrderModal
          order={editOrder}
          sb={sb!}
          onClose={() => setEditOrder(null)}
          onUpdate={() => { loadData(); setEditOrder(null) }}
        />
      )}
    </div>
  )
}


// ─── Filtre Page ──────────────────────────────────────────────────
function FiltrePage({ sb, products, onRefresh }: { sb: any, products: any[], onRefresh: () => void }) {
  // Extrage toate atributele existente din produse
  const existingAttrs = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    products.forEach(p => {
      if (!p.attributes) return
      Object.entries(p.attributes as Record<string, string>).forEach(([k, v]) => {
        if (!map[k]) map[k] = new Set()
        map[k].add(v)
      })
    })
    const result: Record<string, string[]> = {}
    Object.entries(map).forEach(([k, vs]) => { result[k] = Array.from(vs).sort() })
    return result
  }, [products])

  // State pentru creare filtru nou
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // State pentru atribuire filtru la produs
  const [selProduct, setSelProduct] = useState('')
  const [attrKey, setAttrKey] = useState('')
  const [attrVal, setAttrVal] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')

  // Aplica filtru nou la TOATE produsele care nu il au
  async function createAndApplyFilter() {
    if (!newKey.trim() || !newVal.trim()) { setMsg('⚠️ Completeaza cheia si valoarea!'); return }
    setSaving(true)
    setMsg('')
    let count = 0
    for (const p of products) {
      const attrs = (p.attributes as Record<string, string>) || {}
      if (!attrs[newKey]) {
        await sb.from('products').update({
          attributes: { ...attrs, [newKey]: newVal }
        }).eq('id', p.id)
        count++
      }
    }
    setMsg(`✅ Filtrul "${newKey}: ${newVal}" a fost adaugat la ${count} produse care nu il aveau.`)
    setSaving(false)
    onRefresh()
  }

  // Atribuie un filtru specific unui singur produs
  async function assignToProduct() {
    if (!selProduct || !attrKey.trim() || !attrVal.trim()) { setAssignMsg('⚠️ Selecteaza produsul si completeaza filtrul!'); return }
    setAssigning(true)
    setAssignMsg('')
    const p = products.find(x => x.id === selProduct)
    if (!p) { setAssignMsg('Produs negasit'); setAssigning(false); return }
    const attrs = (p.attributes as Record<string, string>) || {}
    const { error } = await sb.from('products').update({
      attributes: { ...attrs, [attrKey]: attrVal }
    }).eq('id', p.id)
    if (error) { setAssignMsg('❌ Eroare: ' + error.message) }
    else { setAssignMsg(`✅ Filtrul "${attrKey}: ${attrVal}" a fost atribuit produsului "${p.name}".`) }
    setAssigning(false)
    onRefresh()
  }

  // Sterge un filtru de la toate produsele
  async function deleteFilterKey(key: string) {
    if (!confirm(`Stergi filtrul "${key}" de la TOATE produsele?`)) return
    for (const p of products) {
      const attrs = { ...(p.attributes as Record<string, string> || {}) }
      if (key in attrs) {
        delete attrs[key]
        await sb.from('products').update({ attributes: attrs }).eq('id', p.id)
      }
    }
    setMsg(`🗑️ Filtrul "${key}" a fost sters de la toate produsele.`)
    onRefresh()
  }

  // Sterge o valoare specifica a unui filtru
  async function deleteFilterValue(key: string, val: string) {
    if (!confirm(`Stergi valoarea "${val}" din filtrul "${key}" de la produsele care o au?`)) return
    let count = 0
    for (const p of products) {
      const attrs = { ...(p.attributes as Record<string, string> || {}) }
      if (attrs[key] === val) {
        delete attrs[key]
        await sb.from('products').update({ attributes: attrs }).eq('id', p.id)
        count++
      }
    }
    setMsg(`🗑️ Valoarea "${val}" a fost stearsa de la ${count} produse.`)
    onRefresh()
  }

  const inputSty: any = {
    padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', outline: 'none', flex: 1
  }
  const labelSty: any = { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' as any, letterSpacing: '0.05em' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Gestioneaza filtrele care apar pe pagina de produse. Filtrele sunt generate automat din atributele produselor.
      </p>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: msg.includes('✅') ? 'rgba(72,187,120,0.1)' : msg.includes('⚠️') ? 'rgba(237,137,54,0.1)' : 'rgba(0,217,255,0.1)', border: `1px solid ${msg.includes('✅') ? 'var(--success)' : msg.includes('⚠️') ? 'var(--warning)' : 'var(--border)'}`, borderRadius: 8, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {msg}
        </div>
      )}

      {/* 1. Filtre existente */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '1rem' }}>
          🏷️ Filtre existente
        </h2>
        {Object.keys(existingAttrs).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Niciun filtru creat inca. Adauga primul filtru mai jos.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(existingAttrs).map(([key, vals]) => (
              <div key={key} style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {key}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 400, marginLeft: '0.5rem' }}>({vals.length} valori)</span>
                  </span>
                  <button onClick={() => deleteFilterKey(key)} style={{ padding: '0.2rem 0.6rem', background: 'rgba(245,101,101,0.1)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                    🗑️ Sterge filtrul
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {vals.map(val => (
                    <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 20, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {val}
                      <button onClick={() => deleteFilterValue(key, val)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.75rem', padding: 0, lineHeight: 1 }}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Creeaza filtru nou */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          ➕ Creeaza filtru nou
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Adauga un filtru nou la toate produsele din catalog care nu il au inca.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 150 }}>
            <label style={labelSty}>Nume filtru (cheie)</label>
            <input style={inputSty} value={newKey} onChange={e => setNewKey(e.target.value)} placeholder='ex: Culoare' list="existing-keys" />
            <datalist id="existing-keys">
              {Object.keys(existingAttrs).map(k => <option key={k} value={k} />)}
            </datalist>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 150 }}>
            <label style={labelSty}>Valoare implicita</label>
            <input style={inputSty} value={newVal} onChange={e => setNewVal(e.target.value)} placeholder='ex: Alb' list="existing-vals" />
            <datalist id="existing-vals">
              {newKey && existingAttrs[newKey]?.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>
          <button onClick={createAndApplyFilter} disabled={saving} style={{ padding: '0.6rem 1.25rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            {saving ? '⏳...' : '✓ Creeaza filtrul'}
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
          * Filtrul va fi adaugat la produsele care nu au inca aceasta cheie. Produsele existente cu alta valoare nu vor fi modificate.
        </p>
      </div>

      {/* 3. Atribuie filtru la un produs specific */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          🎯 Atribuie filtru la un produs specific
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Selecteaza un produs si seteaza sau schimba valoarea unui filtru pentru acel produs.
        </p>

        {assignMsg && (
          <div style={{ padding: '0.6rem 1rem', background: assignMsg.includes('✅') ? 'rgba(72,187,120,0.1)' : 'rgba(245,101,101,0.1)', border: `1px solid ${assignMsg.includes('✅') ? 'var(--success)' : 'var(--error)'}`, borderRadius: 8, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {assignMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={labelSty}>Produs</label>
            <select style={{ ...inputSty, flex: 'none' }} value={selProduct} onChange={e => setSelProduct(e.target.value)}>
              <option value="">— Selecteaza produsul —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {selProduct && (
            <>
              {/* Show current attributes of selected product */}
              {(() => {
                const p = products.find(x => x.id === selProduct)
                const attrs = (p?.attributes as Record<string,string>) || {}
                if (Object.keys(attrs).length > 0) return (
                  <div style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', borderRadius: 8, fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>Filtre curente:</span>
                    {Object.entries(attrs).map(([k,v]) => (
                      <span key={k} style={{ marginRight: '0.5rem', padding: '0.15rem 0.5rem', background: 'var(--bg-hover)', borderRadius: 12, color: 'var(--primary)', fontSize: '0.8rem' }}>{k}: {v}</span>
                    ))}
                  </div>
                )
                return null
              })()}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 140 }}>
                  <label style={labelSty}>Filtru (cheie)</label>
                  <input style={inputSty} value={attrKey} onChange={e => setAttrKey(e.target.value)} placeholder='ex: Culoare' list="akey-list" />
                  <datalist id="akey-list">
                    {Object.keys(existingAttrs).map(k => <option key={k} value={k} />)}
                  </datalist>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 140 }}>
                  <label style={labelSty}>Valoare</label>
                  <input style={inputSty} value={attrVal} onChange={e => setAttrVal(e.target.value)} placeholder='ex: Violet' list="aval-list" />
                  <datalist id="aval-list">
                    {attrKey && existingAttrs[attrKey]?.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <button onClick={assignToProduct} disabled={assigning} style={{ padding: '0.6rem 1.25rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem' }}>
                    {assigning ? '⏳...' : '✓ Atribuie'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactRequests({ sb }: { sb: any }) {
  const [requests, setRequests] = useState<any[]>([])
  const [search, setSearch] = useState('')
  useEffect(() => {
    sb.from('contact_requests').select('*').order('created_at', { ascending: false }).then(({ data }: any) => setRequests(data || []))
  }, [])
  const filtered = requests.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <input placeholder="🔍 Caută..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', maxWidth: 360 }} />
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead><tr><th>Nume</th><th>Email</th><th>Telefon</th><th>Tip</th><th>Mesaj</th><th>Fișier</th><th>Data</th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</td>
                <td><a href={`mailto:${r.email}`} style={{ color: 'var(--primary)' }}>{r.email}</a></td>
                <td>{r.phone || '-'}</td>
                <td><span style={{ padding: '0.2rem 0.5rem', background: 'var(--bg-hover)', borderRadius: 4, fontSize: '0.78rem' }}>{r.type}</span></td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.message || '-'}</td>
                <td>{r.file_url ? <a href={r.file_url} target="_blank" style={{ color: 'var(--primary)' }}>📎</a> : '-'}</td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('ro-RO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
