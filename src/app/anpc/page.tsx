export default function ANPCPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">ANPC</h1>
        <p className="page-subtitle">Autoritatea Națională pentru Protecția Consumatorilor</p>
      </div>
      <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          Conform legislației în vigoare, vă informăm că puteți depune plângeri și sesizări la:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { t: 'ANPC — Autoritatea Națională pentru Protecția Consumatorilor', u: 'https://anpc.ro', l: 'anpc.ro' },
            { t: 'SOL — Platforma de soluționare online a litigiilor (UE)', u: 'https://ec.europa.eu/consumers/odr', l: 'ec.europa.eu/consumers/odr' },
          ].map(item => (
            <div key={item.t} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem' }}>{item.t}</p>
              <a href={item.u} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{item.l}</a>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>
          Comerciantul: TECHNEST PROTOTYPING S.R.L. · CUI: 52582106 · Email: technest.prototyping@gmail.com · Tel: 0754 545 800
        </p>
      </div>
    </>
  )
}
