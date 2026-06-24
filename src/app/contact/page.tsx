'use client'
import { useState } from 'react'
export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, type: 'contact' }) })
    setSent(true)
  }
  return (
    <>
      <div className="page-header"><h1 className="page-title">Contact</h1><p className="page-subtitle">Suntem aici să te ajutăm</p></div>
      <div className="contact-grid">
        <div className="contact-info">
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>📞 Date de Contact</h3>
          <div className="info-item"><span className="info-label">Telefon:</span><span className="info-value"><a href="tel:+40754545800">0754 545 800</a> / <a href="tel:+40760115729">0760 115 729</a></span></div>
          <div className="info-item"><span className="info-label">Email:</span><span className="info-value"><a href="mailto:technest.prototyping@gmail.com">technest.prototyping@gmail.com</a></span></div>
          <div className="info-item"><span className="info-label">Adresă:</span><span className="info-value">Timișoara, 3 August 1919, nr. 21</span></div>
          <div className="info-item"><span className="info-label">Program:</span><span className="info-value">Luni–Vineri: 16:00–22:00</span></div>
        </div>
        <div className="contact-form-wrap">
          {sent ? <div style={{ textAlign: 'center', padding: '2rem' }}><div style={{ fontSize: '3rem' }}>✅</div><h3 style={{ color: 'var(--success)', marginTop: '1rem' }}>Mesaj trimis!</h3><p style={{ color: 'var(--text-secondary)' }}>Te contactăm în curând.</p></div>
          : <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group"><label>Nume *</label><input required value={form.name} onChange={e => setF('name', e.target.value)} /></div>
                <div className="form-group"><label>Email *</label><input required type="email" value={form.email} onChange={e => setF('email', e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Telefon</label><input value={form.phone} onChange={e => setF('phone', e.target.value)} /></div>
              <div className="form-group"><label>Mesaj *</label><textarea required rows={5} value={form.message} onChange={e => setF('message', e.target.value)} /></div>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Trimite Mesajul</button>
            </form>}
        </div>
      </div>
    </>
  )
}
