export default function TermeniConditii() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Termeni și Condiții</h1>
        <p className="page-subtitle">Ultima actualizare: Iunie 2025</p>
      </div>
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[
          { t: '1. Informații despre comerciant', c: 'TECHNEST PROTOTYPING S.R.L., CUI 52582106, Nr. Reg. Com. J2025073596003, sediu: Str. Măgura 3 Timis, 300763, email: technest.prototyping@gmail.com, tel: 0754 545 800.' },
          { t: '2. Produse și prețuri', c: 'Prețurile afișate includ TVA și sunt exprimate în RON. Ne rezervăm dreptul de a modifica prețurile în orice moment, fără notificare prealabilă. Prețul aplicabil este cel afișat la momentul plasării comenzii.' },
          { t: '3. Plasarea comenzii', c: 'O comandă constituie o ofertă de cumpărare. Contractul se consideră încheiat la confirmarea comenzii prin email. Ne rezervăm dreptul de a refuza sau anula comenzi în cazuri justificate.' },
          { t: '4. Plata', c: 'Acceptăm: card online (Visa/Mastercard prin Stripe), transfer bancar, ramburs la livrare sau numerar/POS la sediu. Plata cu cardul este procesată securizat prin Stripe.' },
          { t: '5. Garanție', c: 'Produsele beneficiază de garanție conform legislației în vigoare (minim 2 ani pentru consumatori). Garanția nu acoperă defecțiunile cauzate de utilizarea necorespunzătoare.' },
          { t: '6. Litigii', c: 'Orice litigiu va fi soluționat pe cale amiabilă sau prin instanțele judecătorești competente din România. Puteți accesa platforma SOL pentru soluționarea online a litigiilor: ec.europa.eu/consumers/odr' },
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
