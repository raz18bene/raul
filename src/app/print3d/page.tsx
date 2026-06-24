'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase'

export default function Print3DPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', material: 'PLA', message: '' })
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email) return
    setSending(true)

    let fileUrl = null
    if (file) {
      try {
        const sb = supabaseClient()
        const path = `print3d-requests/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
        const { data } = await sb.storage.from('products').upload(path, file)
        if (data) {
          const { data: url } = sb.storage.from('products').getPublicUrl(path)
          fileUrl = url.publicUrl
        }
      } catch (e) { console.warn('Upload failed:', e) }
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
      <div className="page-header animate-fade-down">
        <h1 className="page-title">Print 3D Custom</h1>
        <p className="page-subtitle">Printare la comandă în 24-48h — trimite fișierul tău sau descrie proiectul</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { icon: '⏱️', t: 'Livrare 24-48h', d: 'Comenzile sunt procesate și printate rapid' },
          { icon: '🎨', t: 'Orice material', d: 'PLA, PETG, ABS, TPU, ASA și altele' },
          { icon: '📐', t: 'Orice dimensiune', d: 'De la piese mici la obiecte mari' },
          { icon: '💰', t: 'Prețuri competitive', d: 'Ofertă personalizată pentru fiecare proiect' },
        ].map(c => (
          <div key={c.t} className="feature-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{c.icon}</div>
            <h3>{c.t}</h3>
            <p>{c.d}</p>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {sent ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: 'var(--success)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
              Cererea a fost trimisă!
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Te contactăm în maxim 24h cu o ofertă personalizată.</p>
            <button
              className="btn btn-secondary"
              style={{ marginTop: '1.5rem' }}
              onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', material: 'PLA', message: '' }); setFile(null) }}
            >
              Trimite altă cerere
            </button>
          </div>
        ) : (
          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
              📨 Cerere Ofertă Print 3D
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nume *</label>
                  <input required value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Ion Popescu" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input required type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="ion@example.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Telefon</label>
                  <input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="07xx xxx xxx" />
                </div>
                <div className="form-group">
                  <label>Material preferat</label>
                  <select value={form.material} onChange={e => setF('material', e.target.value)}>
                    {['PLA', 'PLA+', 'PETG', 'ABS', 'TPU', 'ASA', 'Altul'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Descriere proiect *</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={e => setF('message', e.target.value)}
                  placeholder="Descrie proiectul: dimensiuni, cantitate, culoare, utilizare, detalii speciale..."
                />
              </div>
              <div className="form-group">
                <label>Atașează fișier 3D sau PDF (opțional)</label>
                <div
                  style={{
                    border: '2px dashed var(--border)', borderRadius: '10px', padding: '1.5rem',
                    textAlign: 'center', cursor: 'pointer', background: 'var(--bg-input)',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".stl,.obj,.step,.3mf,.gcode,.pdf,.f3d,.stp"
                    style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  <p style={{ color: file ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    {file ? `📎 ${file.name}` : '📁 Click pentru a atașa fișier 3D sau PDF'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                    STL, OBJ, STEP, 3MF, F3D, PDF — max 50MB
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={sending}
              >
                {sending ? '⏳ Se trimite...' : '📨 Trimite Cererea de Ofertă'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
