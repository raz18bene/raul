'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Product, Order, Category } from '@/types'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [tab, setTab] = useState<'products' | 'orders' | 'contact'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session) checkAdminRole(data.session.user)
    })
  }, [])

  async function checkAdminRole(user: any) {
    const role = user?.app_metadata?.role || user?.user_metadata?.role
    if (role === 'admin') { setAuthed(true); loadData() }
    else { await sb.auth.signOut(); setLoginErr('Nu ai permisiuni de admin.') }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginErr('')
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) { setLoginErr(error.message); return }
    if (data.user) checkAdminRole(data.user)
  }

  async function loadData() {
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

  async function syncStock() {
    setSyncMsg('⏳ Se sincronizează...')
    const r = await fetch('/api/oblio?action=sync-stock')
    const d = await r.json()
    if (d.success) {
      setSyncMsg(`✅ ${d.updated_count} produse actualizate din ${d.total_oblio} în Oblio`)
      loadData()
    } else {
      setSyncMsg('❌ ' + (d.error || 'Eroare'))
    }
  }

  async function generateAWB(order: Order) {
    if (!confirm(`Generezi AWB pentru comanda ${order.order_number}?`)) return
    const addr = order.shipping_address
    const r = await fetch('/api/sameday', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-awb',
        orderNumber: order.order_number,
        recipientName: order.customer_name,
        recipientPhone: order.customer_phone,
        recipientEmail: order.customer_email,
        recipientAddress: addr?.street || '',
        recipientCity: addr?.city || '',
        recipientCounty: addr?.county || '',
        recipientPostalCode: addr?.postal_code || '',
        weight: 1, parcels: 1, cashOnDelivery: 0,
      }),
    })
    const d = await r.json()
    if (d.success) {
      await sb.from('orders').update({ awb_number: d.awbNumber, status: 'shipped' }).eq('id', order.id)
      alert(`✅ AWB: ${d.awbNumber}`)
      loadData()
    } else {
      alert('❌ ' + JSON.stringify(d))
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    await sb.from('orders').update({ status }).eq('id', id)
    loadData()
  }

  if (!authed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '1.5rem' }}>Admin Login</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@technest.ro" />
          </div>
          <div className="form-group">
            <label>Parolă</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {loginErr && <p style={{ color: 'var(--error)', fontSize: '0.88rem' }}>{loginErr}</p>}
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Intră în Admin</button>
        </form>
      </div>
    </div>
  )

  const statusColors: Record<string, string> = {
    pending: '#ed8936', processing: '#00d9ff', shipped: '#48bb78',
    delivered: '#48bb78', cancelled: '#f56565',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.75rem' }}>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={syncStock}>🔄 Sync Stoc Oblio</button>
          <button className="btn btn-secondary btn-sm" onClick={async () => {
            const [s, o] = await Promise.all([fetch('/api/sameday?action=test'), fetch('/api/oblio?action=test')])
            const [sd, od] = await Promise.all([s.json(), o.json()])
            alert(`SameDay: ${sd.message || (sd.ok ? '✅' : '❌ ' + sd.error)}\nOblio: ${od.message || (od.ok ? '✅' : '❌ ' + od.error)}`)
          }}>🔧 Test Integrări</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { sb.auth.signOut(); setAuthed(false) }} style={{ background: 'var(--error)' }}>🚪 Ieși</button>
        </div>
      </div>

      {syncMsg && <p style={{ marginBottom: '1rem', color: syncMsg.includes('✅') ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)' }}>{syncMsg}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {(['products', 'orders', 'contact'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem',
            padding: '0.5rem 1.25rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
            background: tab === t ? 'var(--primary)' : 'var(--bg-input)',
            color: tab === t ? '#000' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}>
            {t === 'products' ? '📦 Produse' : t === 'orders' ? '🛒 Comenzi' : '📩 Cereri'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : tab === 'products' ? (
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{products.length} produse total</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr>
                <th>Produs</th><th>Categorie</th><th>Preț</th><th>Stoc</th><th>SKU</th><th>Status</th>
              </tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                    <td>{(p.categories as any)?.name || '-'}</td>
                    <td style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{(p.sale_price ?? p.price).toFixed(2)} RON</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                        background: p.stock <= 0 ? 'rgba(245,101,101,0.15)' : p.stock <= 10 ? 'rgba(237,137,54,0.15)' : 'rgba(72,187,120,0.15)',
                        color: p.stock <= 0 ? 'var(--error)' : p.stock <= 10 ? 'var(--warning)' : 'var(--success)',
                      }}>{p.stock}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{p.sku || '-'}</td>
                    <td><span style={{ color: p.is_active ? 'var(--success)' : 'var(--error)', fontSize: '0.82rem' }}>{p.is_active ? '✓ Activ' : '✗ Inactiv'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'orders' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(o => (
            <div key={o.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>{o.order_number}</span>
                  <span style={{ marginLeft: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: (statusColors[o.status] || '#718096') + '22', color: statusColors[o.status] || '#718096' }}>{o.status}</span>
                  <p style={{ marginTop: '0.4rem', color: 'var(--text-primary)', fontWeight: 500 }}>{o.customer_name}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{o.customer_email} · {o.customer_phone}</p>
                  <p style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: '0.3rem' }}>{Number(o.total_amount).toFixed(2)} RON</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(o.created_at).toLocaleString('ro-RO')}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 160 }}>
                  <select
                    value={o.status}
                    onChange={e => updateOrderStatus(o.id, e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    {['pending','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {(o as any).awb_number ? (
                    <a href={`https://sameday.ro/tracking?awb=${(o as any).awb_number}`} target="_blank" style={{ padding: '0.45rem 0.75rem', background: 'var(--bg-hover)', border: '1px solid var(--primary)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--primary)', textDecoration: 'none', textAlign: 'center' }}>
                      🏷️ AWB: {(o as any).awb_number}
                    </a>
                  ) : o.shipping_method === 'sameday' ? (
                    <button onClick={() => generateAWB(o)} style={{ padding: '0.45rem 0.75rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                      🚚 Generează AWB
                    </button>
                  ) : null}
                </div>
              </div>
              {o.order_items && o.order_items.length > 0 && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {o.order_items.map((item: any) => (
                    <span key={item.id} style={{ display: 'inline-block', margin: '0.2rem 0.4rem 0.2rem 0', padding: '0.2rem 0.6rem', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {item.product_name} ×{item.quantity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <ContactRequests sb={sb} />
      )}
    </div>
  )
}

function ContactRequests({ sb }: { sb: any }) {
  const [requests, setRequests] = useState<any[]>([])
  useEffect(() => {
    sb.from('contact_requests').select('*').order('created_at', { ascending: false }).then(({ data }: any) => setRequests(data || []))
  }, [])
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead><tr><th>Nume</th><th>Email</th><th>Telefon</th><th>Tip</th><th>Mesaj</th><th>Fișier</th><th>Data</th></tr></thead>
        <tbody>
          {requests.map(r => (
            <tr key={r.id}>
              <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</td>
              <td><a href={`mailto:${r.email}`} style={{ color: 'var(--primary)' }}>{r.email}</a></td>
              <td>{r.phone || '-'}</td>
              <td><span style={{ padding: '0.2rem 0.5rem', background: 'var(--bg-hover)', borderRadius: '4px', fontSize: '0.78rem' }}>{r.type}</span></td>
              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.message || '-'}</td>
              <td>{r.file_url ? <a href={r.file_url} target="_blank" style={{ color: 'var(--primary)' }}>📎 Descarcă</a> : '-'}</td>
              <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('ro-RO')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
