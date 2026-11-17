'use client'
import { useRef, useState } from 'react'

export default function PoliticaRetur() {
  const [form, setForm] = useState({ name: '', email: '', contract: '', details: '' })
  const [review, setReview] = useState(false), [sending, setSending] = useState(false), [error, setError] = useState('')
  const [receipt, setReceipt] = useState<{ receipt: string; emailSent: boolean; id: string } | null>(null)
  const key = useRef(''), busy = useRef(false)
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  async function confirmWithdrawal() {
    if (busy.current) return
    busy.current = true; setSending(true); setError('')
    if (!key.current) key.current = crypto.randomUUID()
    try {
      const response = await fetch('/api/withdrawals', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, requestKey: key.current, confirm: true }) })
      const data = await response.json()
      if (!response.ok || data.success !== true || !data.receipt) throw new Error()
      setReceipt(data)
    } catch { setError('Declarația nu a putut fi confirmată. Reîncearcă sau trimite retragerea prin email la technest.prototyping@gmail.com.') }
    finally { busy.current = false; setSending(false) }
  }
  return <>
    <div className="page-header"><h1 className="page-title">Politica de retur și retragere</h1><p className="page-subtitle">Informații pentru consumatori și declarație online de retragere</p></div>
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gap: '2rem' }}>
      <a href="#retragere" className="btn btn-primary">Retrage-te din contract aici</a>
      <section className="card" style={{ lineHeight: 1.8 }}>
        <h2>Dreptul de retragere</h2>
        <p>Dacă ești consumator și ai cumpărat la distanță, poți anunța retragerea în 14 zile de la primirea bunurilor, fără să justifici decizia. Pentru livrări separate din aceeași comandă, termenul începe la primirea ultimului bun. Pentru servicii, termenul începe de la încheierea contractului. Acest drept nu se confundă cu drepturile privind produsele neconforme.</p>
        <h2>Cum anunți retragerea</h2>
        <p>Folosește funcția de mai jos sau trimite o declarație clară la technest.prototyping@gmail.com ori prin poștă către TECHNEST PROTOTYPING S.R.L., magazinul din Timișoara, 3 August 1919 nr. 21. Nu este necesar un cont, un motiv sau un IBAN pentru transmiterea declarației. Trimiterea înainte de expirarea termenului este suficientă; procesarea de către magazin poate urma ulterior.</p>
        <h2>Returnarea bunurilor</h2>
        <p>Trimite bunurile înapoi în cel mult 14 zile de la comunicarea retragerii. Costurile directe ale returului sunt suportate de consumator. Te rugăm să protejezi bunurile la transport și să incluzi accesoriile primite. Lipsa ambalajului original sau simpla deschidere nu anulează automat dreptul de retragere. Poate fi evaluată diminuarea valorii provocată de utilizarea care depășește verificarea necesară a naturii, caracteristicilor și funcționării bunului.</p>
        <h2>Rambursarea</h2>
        <p>Restituim sumele datorate, inclusiv costul livrării standard, în cel mult 14 zile de când am fost informați despre retragere. Putem amâna rambursarea până primim bunurile sau dovada expedierii, în funcție de care intervine prima. Nu rambursăm suplimentul unei livrări mai scumpe alese de client. Folosim aceeași metodă de plată; o altă metodă poate fi utilizată numai cu acordul tău și fără comisioane pentru tine.</p>
        <h2>Excepții și servicii personalizate</h2>
        <p>Dreptul legal de retragere nu se aplică bunurilor realizate după specificațiile consumatorului sau clar personalizate. Pentru servicii executate integral, excepția se aplică numai în condițiile legale privind acordul expres și informarea despre pierderea dreptului. Începerea unui serviciu în perioada de retragere necesită cererea expresă a consumatorului; dacă acesta se retrage înainte de finalizare, se poate datora partea prestată în condițiile legii. Filamentele deschise nu sunt excluse automat; utilizarea și eventuala diminuare a valorii se evaluează concret.</p>
        <p>Temei: OUG 34/2014, în special art. 9–16 și art. 11¹ privind funcția online de retragere, aplicabil din 19 iunie 2026. Achizițiile persoanelor juridice se soluționează potrivit contractului și regulilor aplicabile acestora.</p>
      </section>
      <section className="card" id="retragere">
        <h2>Retrage-te din contract aici</h2>
        {receipt ? <div role="status">
          <h3>Declarația de retragere a fost înregistrată.</h3>
          <p>{receipt.emailSent ? 'Confirmarea a fost transmisă către serviciul de email. Poți salva și copia de mai jos.' : 'Emailul de confirmare este în așteptare. Salvează acum dovada de mai jos; declarația ta este deja înregistrată.'}</p>
          <a className="btn btn-primary" href={'data:text/plain;charset=utf-8,' + encodeURIComponent(receipt.receipt)} download={`retragere-${receipt.id}.txt`}>Descarcă dovada retragerii</a>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{receipt.receipt}</pre>
        </div> : review ? <div>
          <h3>Verifică declarația</h3>
          <p>Nume: {form.name}</p><p>Email pentru confirmare: {form.email}</p><p>Contract / comandă: {form.contract}</p>
          <p>Declar că mă retrag din contractul identificat mai sus.</p>{form.details && <p>Detalii: {form.details}</p>}
          <p role="alert">{error}</p>
          <button type="button" className="btn btn-secondary" disabled={sending} onClick={() => { setReview(false); key.current = ''; }}>Modifică datele</button>{' '}
          <button type="button" className="btn btn-primary" disabled={sending} onClick={confirmWithdrawal}>{sending ? 'Se transmite...' : 'Confirmă retragerea'}</button>
        </div> : <form onSubmit={e => { e.preventDefault(); setReview(true); setError('') }} style={{ display: 'grid', gap: '1rem' }}>
          <label>Nume *<input required maxLength={200} value={form.name} onChange={e => setF('name', e.target.value)} /></label>
          <label>Email pentru confirmare *<input required type="email" maxLength={254} value={form.email} onChange={e => setF('email', e.target.value)} /></label>
          <label>Număr comandă sau detalii de identificare a contractului *<textarea required maxLength={1000} value={form.contract} onChange={e => setF('contract', e.target.value)} /></label>
          <label>Detalii suplimentare (opțional)<textarea maxLength={3000} value={form.details} onChange={e => setF('details', e.target.value)} /></label>
          <p>Nu include date de card sau IBAN. Dacă sunt necesare informații suplimentare pentru rambursare, te vom contacta separat. Declarația și confirmarea sunt înregistrate și pot fi transmise prin furnizorul nostru de email; vezi <a href="/politica-confidentialitate">politica de confidențialitate</a>.</p>
          <button type="submit" className="btn btn-primary">Revizuiește retragerea</button>
        </form>}
      </section>
    </div>
  </>
}
