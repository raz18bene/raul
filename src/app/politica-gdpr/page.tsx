export default function PoliticaGDPR() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Politica GDPR</h1>
        <p className="page-subtitle">Regulamentul General privind Protecția Datelor</p>
      </div>
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[
          { t: 'Temeiul legal al prelucrării', c: 'Prelucrăm datele dumneavoastră pe baza: executării contractului (procesarea comenzilor), obligației legale (emiterea facturilor), consimțământului (newsletter, dacă v-ați abonat).' },
          { t: 'Operatorul de date', c: 'TECHNEST PROTOTYPING S.R.L., CUI 52582106, sediu social: Str. Măgura 3 Timis, 300763, email: technest.prototyping@gmail.com' },
          { t: 'Transferuri internaționale', c: 'Datele pot fi procesate de furnizori de servicii (Supabase, Vercel) cu infrastructură în UE sau cu garanții adecvate conform GDPR.' },
          { t: 'Exercitarea drepturilor', c: 'Trimiteți o cerere scrisă la technest.prototyping@gmail.com. Răspundem în maxim 30 de zile. Puteți depune plângere la ANSPDCP (www.dataprotection.ro).' },
        ].map(s => (
          <div key={s.t}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.15rem', marginBottom: '0.75rem' }}>{s.t}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{s.c}</p>
          </div>
        ))}
      </div>
    </>
  )
}
