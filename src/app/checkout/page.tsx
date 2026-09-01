'use client'

export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { useRouter } from 'next/navigation'

type Shipping = 'sameday' | 'sediu'
type Payment = 'card' | 'transfer' | 'ramburs'

export default function CheckoutPage() {
  const { cart, total, clearCart, updateQty, removeFromCart } = useCart()
  const router = useRouter()
  const [shipping, setShipping] = useState<Shipping>('sameday')
  const [payment, setPayment] = useState<Payment>('card')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', county: '', postalCode: '',
    notes: '',
  })

  const shippingCost = shipping === 'sediu' ? 0 : 20
  const orderTotal = total + shippingCost

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cart.length) return alert('Coșul este gol!')
    setLoading(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          address: form.address,
          city: form.city,
          county: form.county,
          postalCode: form.postalCode,
          notes: form.notes,
          total: orderTotal,
          shippingMethod: shipping,
          shippingCost,
          paymentMethod: payment,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, sku: i.sku })),
        }),
      })
      const data = await res.json()

      if (res.status === 409 && data.error === 'insufficient_stock') {
        // Stocul s-a schimbat intre timp (produsul a stat "uitat" in cos si intre timp
        // s-a vandut) — actualizam cosul cu stocul real si il lasam pe client sa retrimita.
        const lines = (data.insufficient || [])
          .map((i: any) => `• ${i.name}: ai ${i.requested} în coș, dar mai sunt disponibile doar ${i.available}`)
          .join('\n')
        for (const i of data.insufficient || []) {
          if (i.available > 0) updateQty(i.id, i.available)
          else removeFromCart(i.id)
        }
        alert(`Din păcate stocul s-a schimbat între timp pentru unele produse din coș:\n\n${lines}\n\nAm actualizat coșul — te rugăm verifică și trimite comanda din nou.`)
        setLoading(false)
        return
      }

      if (!data.success) throw new Error(data.error || 'Eroare')

      if (payment === 'card') {
        const pRes = await fetch('/api/netopia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: data.orderNumber,
            total: orderTotal,
            customerName: form.name,
            customerEmail: form.email,
            customerPhone: form.phone,
            address: form.address,
            city: form.city,
            county: form.county,
            postalCode: form.postalCode,
            items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
          }),
        })
        const pData = await pRes.json()
        if (pData.paymentUrl) {
          clearCart()
          window.location.href = pData.paymentUrl
          return
        }
      }

      clearCart()
      router.push(`/payment-return?order=${data.orderNumber}&method=${payment}`)
    } catch (err: any) {
      alert('Eroare: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!cart.length) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
      <span style={{ fontSize: '3rem' }}>🛒</span>
      <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Coșul este gol</h2>
      <a href="/filamente" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
        Explorează produsele
      </a>
    </div>
  )

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Finalizare Comandă</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="checkout-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Date personale */}
            <div className="card">
              <h2 className="card-title">1. Date Personale</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nume Complet *</label>
                    <input required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Ion Popescu" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input required type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="ion@example.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Telefon *</label>
                  <input required value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="07xx xxx xxx" />
                </div>
              </div>
            </div>

            {/* Livrare */}
            <div className="card">
              <h2 className="card-title">2. Metodă de Livrare</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {[
                  { value: 'sameday' as Shipping, icon: '🚚', label: 'Livrare SameDay', sub: '24-48h, oriunde în țară', price: '20,00 RON' },
                  { value: 'sediu' as Shipping, icon: '🏢', label: 'Ridicare de la sediu', sub: 'Timișoara, 3 August 1919, nr. 21', price: 'GRATUIT' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`shipping-option ${shipping === opt.value ? 'active' : ''}`}
                    style={{ flex: '1', minWidth: '170px' }}
                    onClick={() => {
                      setShipping(opt.value)
                      if (opt.value === 'sediu' && payment === 'card') setPayment('ramburs')
                    }}
                  >
                    <input type="radio" name="shipping" value={opt.value} checked={shipping === opt.value} onChange={() => {}} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{opt.label}</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{opt.sub}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.6rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: opt.value === 'sediu' ? '#48bb78' : 'var(--primary)' }}>
                      {opt.price}
                    </div>
                  </label>
                ))}
              </div>

              {shipping === 'sediu' && (
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  📍 <strong style={{ color: 'var(--text-primary)' }}>Adresă:</strong> Timișoara, 3 August 1919, nr. 21<br />
                  🕐 <strong style={{ color: 'var(--text-primary)' }}>Program:</strong> Luni–Vineri 16:00–22:00
                </div>
              )}

              {shipping === 'sameday' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Adresă Completă *</label>
                    <input required value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Str. Exemplu, Nr. 10, Bl. A, Ap. 5" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Oraș *</label>
                      <input required value={form.city} onChange={e => setField('city', e.target.value)} placeholder="Cluj-Napoca" />
                    </div>
                    <div className="form-group">
                      <label>Județ *</label>
                      <input required value={form.county} onChange={e => setField('county', e.target.value)} placeholder="Cluj" />
                    </div>
                    <div className="form-group">
                      <label>Cod Poștal *</label>
                      <input required value={form.postalCode} onChange={e => setField('postalCode', e.target.value)} placeholder="400001" />
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Notițe (opțional)</label>
                <textarea rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Instrucțiuni speciale..." />
              </div>
            </div>

            {/* Plată */}
            <div className="card">
              <h2 className="card-title">3. Metodă de Plată</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { value: 'card' as Payment, icon: '💳', label: 'Card Online', sub: 'Securizat Netopia (Visa/Mastercard)', disabled: shipping === 'sediu' },
                  { value: 'transfer' as Payment, icon: '🏦', label: 'Transfer Bancar', sub: 'Detalii pe email după plasare', disabled: false },
                  { value: 'ramburs' as Payment, icon: '💵', label: shipping === 'sediu' ? 'Numerar / POS la sediu' : 'Ramburs (Numerar/POS)', sub: shipping === 'sediu' ? 'Plătești la ridicare' : 'La livrare prin curier', disabled: false },
                ].filter(o => !o.disabled).map(opt => (
                  <label
                    key={opt.value}
                    className={`payment-option ${payment === opt.value ? 'active' : ''}`}
                    onClick={() => setPayment(opt.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <input type="radio" name="payment" value={opt.value} checked={payment === opt.value} onChange={() => {}} style={{ display: 'none' }} />
                    <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{opt.label}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{opt.sub}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="order-summary card">
            <h2 className="card-title">Sumar Comandă</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {item.images?.[0] && <img src={item.images[0]} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.price.toFixed(2)} RON × {item.quantity}</div>
                  </div>
                  <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{(item.price * item.quantity).toFixed(2)} RON</strong>
                </div>
              ))}
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>{total.toFixed(2)} RON</span>
            </div>
            <div className="summary-row">
              <span>Transport</span>
              <span style={{ color: shippingCost === 0 ? '#48bb78' : 'var(--primary)', fontWeight: 600 }}>
                {shippingCost === 0 ? 'GRATUIT' : `${shippingCost.toFixed(2)} RON`}
              </span>
            </div>
            <div className="summary-row" style={{ borderTop: '2px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
              <span className="summary-total">{orderTotal.toFixed(2)} RON</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }} disabled={loading}>
              {loading ? '⏳ Se procesează...' : payment === 'card' ? '💳 Plătește Online' : '✓ Plasează Comanda'}
            </button>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
              🔒 Datele tale sunt în siguranță
            </p>
          </div>
        </div>
      </form>
    </>
  )
}