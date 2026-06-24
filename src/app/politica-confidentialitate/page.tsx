export default function PoliticaConfidentialitate() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Politica de Confidențialitate</h1>
        <p className="page-subtitle">Ultima actualizare: Iunie 2025</p>
      </div>
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[
          { t: '1. Datele pe care le colectăm', c: 'Colectăm datele pe care ni le furnizați direct: nume, adresă de email, număr de telefon, adresă de livrare, necesare pentru procesarea comenzilor și comunicarea cu dumneavoastră.' },
          { t: '2. Cum folosim datele', c: 'Datele sunt folosite exclusiv pentru: procesarea comenzilor, livrarea produselor, comunicarea privind comenzile, îmbunătățirea serviciilor noastre. Nu vindem sau cedăm datele dumneavoastră terților.' },
          { t: '3. Stocarea datelor', c: 'Datele sunt stocate securizat în infrastructura Supabase, cu criptare în tranzit și în repaus. Le păstrăm atât timp cât este necesar pentru scopurile menționate sau conform cerințelor legale.' },
          { t: '4. Drepturile dumneavoastră (GDPR)', c: 'Aveți dreptul la: acces la datele personale, rectificarea datelor incorecte, ștergerea datelor ("dreptul de a fi uitat"), restricționarea prelucrării, portabilitatea datelor, opoziția față de prelucrare.' },
          { t: '5. Cookie-uri', c: 'Folosim cookie-uri strict necesare pentru funcționarea site-ului (coș de cumpărături, preferințe temă). Nu folosim cookie-uri de tracking sau publicitate.' },
          { t: '6. Contact', c: 'Pentru orice solicitare legată de datele personale, contactați-ne la: technest.prototyping@gmail.com sau 0754 545 800.' },
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
