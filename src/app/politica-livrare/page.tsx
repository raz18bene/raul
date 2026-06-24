export default function PoliticaLivrare() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Politica de Livrare</h1>
        <p className="page-subtitle">Informații despre transport și livrare</p>
      </div>
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[
          { t: 'Metode de livrare', c: 'Livrăm prin SameDay Courier în toată România. Ridicare gratuită de la sediul nostru din Timișoara, 3 August 1919, nr. 21, program L-V 16:00-22:00.' },
          { t: 'Termene de livrare', c: 'Comenzile plasate până la 18:00 sunt procesate în aceeași zi. Livrarea prin SameDay se efectuează în 24-48 de ore lucrătoare de la preluare.' },
          { t: 'Costuri de transport', c: 'Livrare SameDay: 20 RON indiferent de greutate sau valoare. Ridicare de la sediu: GRATUITĂ.' },
          { t: 'Tracking colet', c: 'După generarea AWB-ului, veți primi numărul de tracking pe email. Puteți urmări coletul pe site-ul SameDay.' },
          { t: 'Probleme la livrare', c: 'În cazul în care coletul nu poate fi livrat, curierul vă va contacta telefonic. Contactați-ne la 0754 545 800 sau technest.prototyping@gmail.com pentru orice problemă.' },
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
