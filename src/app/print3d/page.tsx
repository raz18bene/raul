'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProductsPage from '@/components/shop/ProductsPage'

export default function Print3DPage() {
  const [tab, setTab] = useState<'products' | 'oferta'>('products')
  const [form, setForm] = useState({ name: '', email: '', phone: '', material: 'PLA', message: '' })
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email) return
    setSending(true)

    let fileUrl = null
    if (file) {
      const path = `print3d-requests/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
      const { data } = await supabase.storage.from('products').upload(path, file)
      if (data) {
        const { data: url } = supabase.storage.from('products').getPublicUrl(path)
        fileUrl = url.publicUrl
      }
    }

    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: 'oferta-print3d', fileUrl }),
    })

    setSent(true)
    setSending(false)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Print 3D</h1>
        <p className="page-subtitle">Produse predefinite sau servicii personalizate la comandă</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <button onClick={() => setTab('products')} className="btn" style={{ background: tab === 'products' ? 'var(--primary)' : 'var(--bg-input)', color: tab === 'products' ? '#000' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          📦 Toate Produsele
        </button>
        <button onClick={() => setTab('oferta')} className="btn" style={{ background: tab === 'oferta' ? 'var(--primary)' : 'var(--bg-input)', color: tab === 'oferta' ? '#000' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          📨 Cerere Ofertă Personalizată
        </button>
      </div>

      {tab === 'products' ? (
        <ProductsPage categorySlug="print-3d" title="" />
      ) : sent ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: 'var(--success)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Cererea a fost trimisă!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Te contactăm în maxim 24h cu o ofertă personalizată.</p>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 600 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Cerere Ofertă Print 3D</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-row">
              <div className="form-group"><label>Nume *</label><input required value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ion Popescu" /></div>
              <div className="form-group"><label>Email *</label><input required type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="ion@example.com" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Telefon</label><input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="07xx xxx xxx" /></div>
              <div className="form-group">
                <label>Material</label>
                <select value={form.material} onChange={e => setF('material', e.target.value)}>
                  {['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Altul'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Descriere proiect</label>
              <textarea rows={4} value={form.message} onChange={e => setF('message', e.target.value)} placeholder="Descrie proiectul, dimensiunile, cantitatea, culoarea..." />
            </div>
            <div className="form-group">
              <label>Atașează fișier 3D (STL, OBJ, STEP, 3MF, PDF)</label>
              <div
                style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', background: 'var(--bg-hover)' }}
                onClick={() => document.getElementById('file-upload')?.click()}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <input id="file-upload" type="file" accept=".stl,.obj,.step,.3mf,.gcode,.pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
                <p style={{ color: file ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {file ? `📎 ${file.name}` : '📁 Click pentru a atașa fișier 3D sau PDF'}
                </p>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={sending}>
              {sending ? '⏳ Se trimite...' : '📨 Trimite Cererea de Ofertă'}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
