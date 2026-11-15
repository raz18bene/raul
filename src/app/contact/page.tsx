'use client'

export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useContactSubmission } from '@/hooks/useContactSubmission'
export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const { sent, sending, error, submit } = useContactSubmission()
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit(() => ({ ...form, type: 'contact' }))
  }
  return (
    <>
      <div className="page-header"><h1 className="page-title">Contact TechNest în Timișoara</h1><p className="page-subtitle">Întrebări despre filamente, componente electronice, piese de imprimante sau servicii de printare 3D? Scrie-ne sau contactează magazinul.</p></div>
      <div className="contact-grid">
        <div className="contact-info">
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>📞 Date de Contact</h3>
          <div className="info-item"><span className="info-label">Telefon:</span><span className="info-value"><a href="tel:+40754545800">0754 545 800</a> / <a href="tel:+40760115729">0760 115 729</a></span></div>
          <div className="info-item"><span className="info-label">Email:</span><span className="info-value"><a href="mailto:technest.prototyping@gmail.com">technest.prototyping@gmail.com</a></span></div>
          <div className="info-item"><span className="info-label">Adresă:</span><span className="info-value">Timișoara, 3 August 1919, nr. 21</span></div>
          <div className="info-item"><span className="info-label">Program:</span><span className="info-value">Luni–Vineri: 16:00–22:00</span></div>
        </div>
        <div className="contact-form-wrap">
          {sent ? <div style={{ textAlign: 'center', padding: '2rem' }}><div style={{ fontSize: '3rem' }}>✅</div><h3 style={{ color: 'var(--success)', marginTop: '1rem' }}>Mesaj înregistrat!</h3><p style={{ color: 'var(--text-secondary)' }}>Te contactăm în curând.</p></div>
          : <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group"><label>Nume *</label><input required value={form.name} onChange={e => setF('name', e.target.value)} /></div>
                <div className="form-group"><label>Email *</label><input required type="email" value={form.email} onChange={e => setF('email', e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Telefon</label><input value={form.phone} onChange={e => setF('phone', e.target.value)} /></div>
              <div className="form-group"><label>Mesaj *</label><textarea required rows={5} value={form.message} onChange={e => setF('message', e.target.value)} /></div>
              <p role="alert" style={{ color: 'var(--error)' }}>{error}</p>
              <button type="submit" disabled={sending} className="btn btn-primary" style={{ justifyContent: 'center' }}>{sending ? 'Se trimite...' : 'Trimite Mesajul'}</button>
            </form>}
        </div>
      </div>
      <section style={{ maxWidth: 880, margin: '3rem auto 0', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
        <h2 className="section-title">Cu ce te putem ajuta?</h2>
        <p>Pentru alegerea unui filament sau a unei componente electronice, menționează imprimanta, placa de dezvoltare sau aplicația pentru care ai nevoie de produs. În cazul pieselor de schimb pentru imprimante 3D, modelul exact și codul piesei ne ajută să discutăm compatibilitatea.</p>
        <p>Dacă dorești printarea unei piese la comandă, poți folosi și <a href="/print3d">formularul pentru ofertă de printare 3D</a>, unde poți atașa un model sau descrie proiectul. Pentru întrebări despre comenzi și disponibilitate, utilizează datele de contact afișate mai sus.</p>
      </section>
    </>
  )
}
