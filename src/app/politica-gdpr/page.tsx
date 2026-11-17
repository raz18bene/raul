export default function PoliticaGDPR() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Politica GDPR</h1>
        <p className="page-subtitle">Regulamentul General privind Protecția Datelor</p>
      </div>
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[
          { t: 'Temeiul legal al prelucrării', c: 'Prelucrăm datele dumneavoastră pe baza executării contractului, obligațiilor legale și interesului legitim pentru securitate și gestionarea solicitărilor. Reținerea opțională a datelor de livrare în browser se bazează pe alegerea dumneavoastră.' },
          { t: 'Operatorul de date', c: 'TECHNEST PROTOTYPING S.R.L., CUI 52582106, sediu social: Str. Măgura 3 Timis, 300763, email: technest.prototyping@gmail.com' },
          { t: 'Transferuri internaționale', c: 'Furnizorii și tipurile de prelucrare sunt descrise în politica de confidențialitate. Pentru detalii despre localizare, transferuri și garanțiile aplicabile, ne puteți contacta.' },
          { t: 'Exercitarea drepturilor', c: 'Trimiteți o cerere scrisă la technest.prototyping@gmail.com. Răspundem, de regulă, în termen de o lună, cu eventualele prelungiri și informări prevăzute de GDPR. Puteți depune plângere la ANSPDCP (www.dataprotection.ro).' },
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
