'use client'

import { useState } from 'react'

export default function PoliticaRetur() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', orderNumber: '',
    productName: '', reason: '', bankIBAN: '', bankName: '',
  })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: `Cerere retur\nNr. comandă: ${form.orderNumber}\nProdus: ${form.productName}\nMotiv: ${form.reason}\nIBAN: ${form.bankIBAN}\nBancă: ${form.bankName}`,
        type: 'cerere-retur',
      }),
    })
    setSent(true)
    setSending(false)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Politica de Retur</h1>
        <p className="page-subtitle">Dreptul de retragere și condițiile de retur</p>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Policy text */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { t: '📋 Dreptul de retragere', c: 'Conform OUG 34/2014, aveți dreptul de a vă retrage din contract în termen de 14 zile calendaristice de la primirea produsului, fără a fi nevoie să justificați decizia.' },
            { t: '✅ Condiții de retur', c: 'Produsele returnate trebuie să fie în starea originală, nefolosite, cu ambalajul intact și cu toate accesoriile incluse. Produsele personalizate sau consumate nu pot fi returnate.' },
            { t: '🚚 Procedura de retur', c: 'Completați formularul de mai jos pentru a iniția returul. Veți primi pe email instrucțiunile de expediere. Costul returului este suportat de client.' },
            { t: '💰 Rambursarea', c: 'Rambursăm suma în termen de 14 zile de la primirea produselor returnate și verificarea lor. Suma se returnează prin transfer bancar în contul indicat în formularul de retur.' },
            { t: '⛔ Excepții', c: 'Nu pot fi returnate: filamentele deschise/utilizate, produse personalizate la cererea clientului, produse deteriorate din vina clientului.' },
          ].map(s => (
            <div key={s.t}>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{s.t}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{s.c}</p>
            </div>
          ))}
        </div>

        {/* Return form */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.3rem', marginBottom: '0.25rem' }}>
            📦 Formular de Retur
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Completează formularul și te contactăm în maxim 24h cu instrucțiunile de retur.
          </p>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '2.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ color: 'var(--success)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
                Cererea a fost trimisă!
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Te contactăm în maxim 24h cu instrucțiunile de retur și adresa de expediere.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,217,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ℹ️ Câmpurile marcate cu <span style={{ color: 'var(--error)' }}>*</span> sunt obligatorii. Rambursarea se face prin transfer bancar în contul indicat.
              </div>

              {/* Date personale */}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '-0.25rem' }}>
                Date Personale
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nume și Prenume <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input required value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ion Popescu" />
                </div>
                <div className="form-group">
                  <label>Email <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input required type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="ion@example.com" />
                </div>
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="07xx xxx xxx" />
              </div>

              {/* Detalii comandă */}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem', marginBottom: '-0.25rem' }}>
                Detalii Comandă
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Număr Comandă <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input required value={form.orderNumber} onChange={e => setF('orderNumber', e.target.value)} placeholder="ORD-1234567890" />
                </div>
                <div className="form-group">
                  <label>Denumire Produs <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input required value={form.productName} onChange={e => setF('productName', e.target.value)} placeholder="ex: BambuLab PLA Matte 1kg" />
                </div>
              </div>
              <div className="form-group">
                <label>Motiv retur <span style={{ color: 'var(--error)' }}>*</span></label>
                <select required value={form.reason} onChange={e => setF('reason', e.target.value)}>
                  <option value="">— Selectează motivul —</option>
                  <option value="Produs defect / deteriorat la livrare">Produs defect / deteriorat la livrare</option>
                  <option value="Produs diferit față de descriere">Produs diferit față de descriere</option>
                  <option value="M-am răzgândit (drept de retragere 14 zile)">M-am răzgândit (drept de retragere 14 zile)</option>
                  <option value="Dimensiune / specificații incorecte">Dimensiune / specificații incorecte</option>
                  <option value="Produs incorect livrat">Produs incorect livrat</option>
                  <option value="Alt motiv">Alt motiv</option>
                </select>
              </div>

              {/* Date bancare */}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem', marginBottom: '-0.25rem' }}>
                Date Bancare (pentru rambursare)
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>IBAN <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input required value={form.bankIBAN} onChange={e => setF('bankIBAN', e.target.value.toUpperCase())} placeholder="RO49 AAAA 1B31 0075 9384 0000" maxLength={34} style={{ fontFamily: 'monospace' }} />
                </div>
                <div className="form-group">
                  <label>Banca <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input required value={form.bankName} onChange={e => setF('bankName', e.target.value)} placeholder="ex: BT, ING, Raiffeisen..." />
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'rgba(72,187,120,0.06)', border: '1px solid rgba(72,187,120,0.3)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                🔒 Datele bancare sunt folosite exclusiv pentru rambursarea sumei și nu sunt stocate în nicio bază de date externă.
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={sending}
              >
                {sending ? '⏳ Se trimite...' : '📤 Trimite Cererea de Retur'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
