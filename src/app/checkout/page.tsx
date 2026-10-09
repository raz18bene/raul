'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useCart } from '@/hooks/useCart'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import Link from 'next/link'
import dynamicImport from 'next/dynamic'
import type { Locker } from '@/types'

// Harta se incarca doar in browser, la cerere (Leaflet nu merge la server-side render)
const EasyboxMap = dynamicImport(() => import('@/components/shop/EasyboxMap'), { ssr: false })

type Shipping = 'sameday' | 'easybox' | 'sediu'
type Payment = 'card' | 'transfer' | 'ramburs'

// Cheia sub care tinem datele de livrare ale clientului in browser-ul lui,
// ca sa nu le mai reintroduca de fiecare data cand revine sa cumpere ceva.
// Nu e un cont — e doar o "amintire" locala, in browser-ul respectiv.
const SAVED_INFO_KEY = 'tn_checkout_info'

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart()
  const router = useRouter()
  const [shipping, setShipping] = useState<Shipping>('sameday')
  const [payment, setPayment] = useState<Payment>('card')
  const [loading, setLoading] = useState(false)
  const [locker, setLocker] = useState<Locker | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  // Facturare: persoana fizica sau juridica (acordeon — se deschide doar cea aleasa)
  const [billingType, setBillingType] = useState<'pf' | 'pj'>('pf')
  const [sameAddr, setSameAddr] = useState(true)
  const [bill, setBill] = useState({ name: '', company: '', cui: '', regCom: '', address: '', city: '', county: '', postalCode: '', vatPayer: false })
  function setBillField(k: string, v: string | boolean) { setBill(b => ({ ...b, [k]: v })) }
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', county: '', postalCode: '',
    notes: '',
  })
  // Daca clientul e autentificat, comanda i se leaga de cont si preumplem din
  // profilul lui salvat in Supabase (nu doar din acest browser, ca la localStorage).
  const [account, setAccount] = useState<{ user: any; accessToken: string } | null>(null)

  // La prima incarcare, preumple formularul cu datele salvate dintr-o comanda anterioara
  // (daca exista in acest browser), ca sa nu le mai bata din nou clientul care revine —
  // apoi, daca e si autentificat, datele din contul lui au prioritate (sunt mai sigure).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_INFO_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm(f => ({ ...f, ...parsed, notes: '' }))
      }
    } catch { /* ignoram — nu e critic daca nu merge in acest browser */ }

    const sb = getSupabase()
    sb.auth.getSession().then(async ({ data }: any) => {
      const session = data.session
      if (!session?.user) return
      setAccount({ user: session.user, accessToken: session.access_token })
      const { data: prof } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      setForm(f => ({
        ...f,
        name: prof?.full_name || f.name,
        email: session.user.email || f.email,
        phone: prof?.phone || f.phone,
        address: prof?.address || f.address,
        city: prof?.city || f.city,
        county: prof?.county || f.county,
        postalCode: prof?.postal_code || f.postalCode,
      }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shippingCost = shipping === 'sediu' ? 0 : 20
  const orderTotal = total + shippingCost

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  // Parseaza raspunsul ca JSON fara sa arunce eroare daca serverul a raspuns
  // gol/nevalid (ex. problema de retea la Stripe) — ca sa nu mai apara mesajul
  // criptic "Unexpected end of JSON input" catre client.
  async function safeJson(res: Response): Promise<any> {
    const text = await res.text()
    if (!text) return {}
    try { return JSON.parse(text) } catch { return {} }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cart.length) return alert('Coșul este gol!')
    if (shipping === 'easybox' && !locker) { setMapOpen(true); return alert('Alege un easybox de pe hartă pentru livrare.') }
    if (billingType === 'pj' && !/^(RO)?\s?\d{2,10}$/i.test(bill.cui.trim())) return alert('CUI invalid. Exemplu: RO12345678 sau 12345678.')
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
          locker: shipping === 'easybox' ? locker : null,
          billing: billingType === 'pj'
            ? { type: 'pj', company: bill.company, cui: bill.cui, regCom: bill.regCom, address: bill.address, city: bill.city, county: bill.county, postalCode: bill.postalCode, vatPayer: bill.vatPayer }
            : { type: 'pf', name: bill.name || form.name, sameAsDelivery: sameAddr && shipping !== 'easybox', address: bill.address, city: bill.city, county: bill.county, postalCode: bill.postalCode },
          shippingCost,
          paymentMethod: payment,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, sku: i.sku })),
          // Trimitem token-ul de sesiune doar daca userul e autentificat — serverul il verifica
          // el insusi (nu are incredere intr-un userId trimis simplu din browser) si leaga
          // comanda de contul real al userului, plus ii actualizeaza profilul salvat.
          accessToken: account?.accessToken || null,
        }),
      })
      const data = await safeJson(res)
      if (!res.ok || !data.success) throw new Error(data.error || 'Comanda nu a putut fi înregistrată. Te rugăm să reîncerci.')

      // Comanda a reusit — salveaza datele de livrare in acest browser, ca data viitoare
      // cand clientul revine sa cumpere ceva, formularul sa fie deja preumplut.
      try {
        localStorage.setItem(SAVED_INFO_KEY, JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          address: form.address, city: form.city, county: form.county, postalCode: form.postalCode,
        }))
      } catch { /* ignoram — nu e critic */ }

      // Comanda a fost creata cu succes in acest punct — orice eroare de mai jos
      // (ex. la inițierea plății cu cardul) nu mai anulează comanda, doar plata cu cardul.
      if (payment === 'card') {
        const pRes = await fetch('/api/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: data.orderNumber,
            total: orderTotal,
            shippingCost,
            customerName: form.name,
            customerEmail: form.email,
            customerPhone: form.phone,
            address: shipping === 'easybox' && locker ? `${locker.name} — ${locker.address}` : form.address,
            city: shipping === 'easybox' && locker ? locker.city : form.city,
            county: shipping === 'easybox' && locker ? locker.county : form.county,
            postalCode: shipping === 'easybox' && locker ? (locker.postalCode || '') : form.postalCode,
            items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
          }),
        })
        const pData = await safeJson(pRes)
        if (pData.url) {
          clearCart()
          window.location.href = pData.url
          return
        }
        // Nu am primit link de plată — comanda există deja (vezi mai sus), dar clientul
        // trebuie anunțat clar că plata cu cardul nu a pornit, ca sa aleaga alta metoda
        // sau sa ne contacteze, in loc sa vada o eroare tehnica fara sens.
        clearCart()
        alert('Comanda a fost înregistrată, dar plata online cu cardul nu a putut fi inițiată chiar acum. Te vom contacta pentru a stabili o altă metodă de plată, sau ne poți contacta tu direct.')
        router.push(`/payment-return?order=${data.orderNumber}&method=${payment}`)
        return
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

            {account ? (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                👤 Comanda va fi legată de contul <strong style={{ color: 'var(--text-primary)' }}>{account.user.email}</strong> — o vei regăsi la <Link href="/cont" style={{ color: 'var(--primary)' }}>Contul meu</Link>.
              </div>
            ) : (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Comanzi ca vizitator, fără cont. Ai deja un <Link href="/cont" style={{ color: 'var(--primary)' }}>cont</Link>? Autentifică-te înainte de a plasa comanda, ca să-ți fie salvată acolo.
              </div>
            )}

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
                  { value: 'easybox' as Shipping, icon: '📦', label: 'Livrare în easybox', sub: 'Alegi punctul de pe hartă', price: '20,00 RON' },
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

              {shipping === 'easybox' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {locker ? (
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-hover)', border: '1px solid var(--primary)', borderRadius: 8, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      📦 <strong style={{ color: 'var(--text-primary)' }}>{locker.name}</strong><br />
                      {locker.address}, {locker.city}, {locker.county} {locker.postalCode}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Nu ai ales încă niciun easybox.</div>
                  )}
                  <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setMapOpen(true)}>
                    🗺️ {locker ? 'Schimbă easybox-ul' : 'Alege easybox pe hartă'}
                  </button>
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

            {/* Facturare — acordeon persoana fizica / juridica */}
            <div className="card">
              <h2 className="card-title">3. Facturare</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {([
                  { v: 'pf' as const, icon: '👤', label: 'Persoană fizică' },
                  { v: 'pj' as const, icon: '🏢', label: 'Persoană juridică (firmă)' },
                ]).map(o => {
                  const open = billingType === o.v
                  return (
                    <div key={o.v} style={{ border: `1px solid ${open ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden' }}>
                      <button type="button" onClick={() => setBillingType(o.v)} aria-expanded={open}
                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: open ? 'var(--bg-hover)' : 'var(--bg-input)', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem' }}>
                        <span>{o.icon} {o.label}</span>
                        <span style={{ color: 'var(--primary)' }}>{open ? '▲' : '▼'}</span>
                      </button>
                      {open && o.v === 'pf' && (
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div className="form-group">
                            <label>Nume pe factură *</label>
                            <input required value={bill.name || form.name} onChange={e => setBillField('name', e.target.value)} placeholder="Ion Popescu" />
                          </div>
                          {shipping !== 'easybox' && (
                            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                              <input type="checkbox" checked={sameAddr} onChange={e => setSameAddr(e.target.checked)} />
                              Adresa de facturare este aceeași cu cea de livrare
                            </label>
                          )}
                          {(shipping === 'easybox' || !sameAddr) && (
                            <>
                              <div className="form-group">
                                <label>Adresă facturare *</label>
                                <input required value={bill.address} onChange={e => setBillField('address', e.target.value)} placeholder="Str. Exemplu, Nr. 10" />
                              </div>
                              <div className="form-row">
                                <div className="form-group"><label>Oraș *</label><input required value={bill.city} onChange={e => setBillField('city', e.target.value)} /></div>
                                <div className="form-group"><label>Județ *</label><input required value={bill.county} onChange={e => setBillField('county', e.target.value)} /></div>
                                <div className="form-group"><label>Cod Poștal</label><input value={bill.postalCode} onChange={e => setBillField('postalCode', e.target.value)} /></div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {open && o.v === 'pj' && (
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div className="form-group">
                            <label>Denumire firmă *</label>
                            <input required value={bill.company} onChange={e => setBillField('company', e.target.value)} placeholder="EXEMPLU S.R.L." />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>CUI / CIF *</label>
                              <input required value={bill.cui} onChange={e => setBillField('cui', e.target.value)} placeholder="RO12345678" />
                            </div>
                            <div className="form-group">
                              <label>Nr. Reg. Com. *</label>
                              <input required value={bill.regCom} onChange={e => setBillField('regCom', e.target.value)} placeholder="J35/1234/2020" />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Adresă sediu social *</label>
                            <input required value={bill.address} onChange={e => setBillField('address', e.target.value)} placeholder="Str. Exemplu, Nr. 10" />
                          </div>
                          <div className="form-row">
                            <div className="form-group"><label>Oraș *</label><input required value={bill.city} onChange={e => setBillField('city', e.target.value)} /></div>
                            <div className="form-group"><label>Județ *</label><input required value={bill.county} onChange={e => setBillField('county', e.target.value)} /></div>
                            <div className="form-group"><label>Cod Poștal</label><input value={bill.postalCode} onChange={e => setBillField('postalCode', e.target.value)} /></div>
                          </div>
                          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                            <input type="checkbox" checked={bill.vatPayer} onChange={e => setBillField('vatPayer', e.target.checked)} />
                            Firma este plătitoare de TVA
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Plată */}
            <div className="card">
              <h2 className="card-title">4. Metodă de Plată</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { value: 'card' as Payment, icon: '💳', label: 'Card Online', sub: 'Securizat prin Stripe (Visa/Mastercard)', disabled: shipping === 'sediu' },
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

      {mapOpen && (
        <EasyboxMap
          open={mapOpen}
          onClose={() => setMapOpen(false)}
          onSelect={setLocker}
          selectedId={locker?.id}
        />
      )}
    </>
  )
}
