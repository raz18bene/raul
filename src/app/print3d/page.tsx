'use client'

export const dynamic = 'force-dynamic'

import { useRef, useState } from 'react'
import { useContactSubmission } from '@/hooks/useContactSubmission'
import { supabaseClient } from '@/lib/supabase'

export default function Print3DPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', material: 'PLA', message: '' })
  const [file, setFile] = useState<File | null>(null)
  const { sending, sent, error, submit, reset } = useContactSubmission()
  const uploaded = useRef<{ file: File; url: string } | null>(null)
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit(async () => {
      let fileUrl = null
      if (file) {
        if (file.size > 50 * 1024 * 1024) throw new Error('Fișierul depășește limita de 50 MB.')
        if (uploaded.current?.file === file) fileUrl = uploaded.current.url
        else {
          try {
            const sb = supabaseClient()
            const path = `print3d-requests/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
            const { data, error: uploadError } = await sb.storage.from('products').upload(path, file)
            if (uploadError || !data) throw new Error('upload failed')
            fileUrl = sb.storage.from('products').getPublicUrl(data.path).data.publicUrl
            uploaded.current = { file, url: fileUrl }
          } catch {
            throw new Error('Fișierul nu a putut fi încărcat. Încearcă din nou sau trimite cererea fără atașament.')
          }
        }
      }
      return { ...form, type: 'oferta-print3d', fileUrl }
    })
  }

  return (
    <>
      <div className="page-header animate-fade-down">
        <h1 className="page-title">Printare 3D la comandă în Timișoara</h1>
        <p className="page-subtitle">Trimite fișierul 3D sau descrie proiectul pentru a primi o ofertă personalizată și un termen estimat.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { icon: '⏱️', t: 'Termen estimat', d: 'Durata depinde de dimensiuni, complexitate și volumul comenzii' },
          { icon: '🎨', t: 'Materiale variate', d: 'Opțiuni precum PLA, PETG, ABS, TPU sau ASA, în funcție de proiect' },
          { icon: '📐', t: 'Piese mici și mari', d: 'Dimensiunile realizabile depind de echipament și material' },
          { icon: '💰', t: 'Prețuri competitive', d: 'Ofertă personalizată pentru fiecare proiect' },
        ].map(c => (
          <div key={c.t} className="feature-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{c.icon}</div>
            <h3>{c.t}</h3>
            <p>{c.d}</p>
          </div>
        ))}
      </div>

      <section style={{ maxWidth: 850, margin: '0 auto 2.5rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        <h2 className="section-title">Ce informații ne ajută să ofertăm o piesă printată 3D?</h2>
        <p>Poți atașa un model STL, OBJ, STEP sau 3MF, ori poți descrie piesa dorită dacă nu ai încă un fișier. Menționează dimensiunile aproximative, cantitatea, materialul preferat și condițiile în care va fi folosită piesa.</p>
        <p>Prețul și termenul de realizare depind de geometrie, dimensiuni, material, numărul de bucăți și finisajul solicitat. După evaluarea proiectului, îți comunicăm soluția disponibilă și estimarea de cost și timp.</p>
        <p>TechNest oferă servicii de printare 3D la comandă în Timișoara, pentru prototipuri, piese funcționale și proiecte personalizate. Pentru compatibilitate sau material, putem discuta cerințele tehnice înainte de producție.</p>
      </section>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {sent ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: 'var(--success)', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
              Cererea a fost înregistrată!
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Te contactăm în maxim 24h cu o ofertă personalizată.</p>
            <button
              className="btn btn-secondary"
              style={{ marginTop: '1.5rem' }}
              onClick={() => { reset(); uploaded.current = null; setForm({ name: '', email: '', phone: '', material: 'PLA', message: '' }); setFile(null) }}
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
              <p role="alert" style={{ color: 'var(--error)' }}>{error}</p>
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
