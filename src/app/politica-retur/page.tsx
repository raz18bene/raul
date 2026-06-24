export default function PoliticaRetur() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Politica de Retur</h1>
        <p className="page-subtitle">Dreptul de retragere și condițiile de retur</p>
      </div>
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[
          { t: 'Dreptul de retragere', c: 'Conform OUG 34/2014, aveți dreptul de a vă retrage din contract în termen de 14 zile calendaristice de la primirea produsului, fără a fi nevoie să justificați decizia.' },
          { t: 'Condiții de retur', c: 'Produsele returnate trebuie să fie în starea originală, nefolosite, cu ambalajul intact și cu toate accesoriile incluse. Produsele personalizate sau consumate nu pot fi returnate.' },
          { t: 'Procedura de retur', c: 'Contactați-ne la technest.prototyping@gmail.com sau 0754 545 800 pentru a iniția returul. Veți primi instrucțiunile de expediere. Costul returului este suportat de client.' },
          { t: 'Rambursarea', c: 'Rambursăm suma în termen de 14 zile de la primirea produselor returnate și verificarea lor. Suma se returnează prin același mijloc de plată folosit la cumpărare.' },
          { t: 'Excepții', c: 'Nu pot fi returnate: filamentele deschise/utilizate, produse personalizate la cererea clientului, produse deteriorate din vina clientului.' },
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
