export default function DespreNoiPage() {
  const SPOOL = <svg width="36" height="36" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="18" stroke="var(--primary)" strokeWidth="2"/><circle cx="22" cy="22" r="7" stroke="var(--primary)" strokeWidth="2"/><circle cx="22" cy="22" r="3" fill="var(--primary)"/><line x1="22" y1="4" x2="22" y2="15" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/><line x1="22" y1="29" x2="22" y2="40" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/></svg>
  const CHIP = <svg width="36" height="36" viewBox="0 0 44 44" fill="none"><rect x="13" y="13" width="18" height="18" rx="3" stroke="var(--primary)" strokeWidth="2"/><rect x="17" y="17" width="10" height="10" rx="2" stroke="var(--primary)" strokeWidth="1.5" fill="var(--primary)" fillOpacity=".15"/><line x1="17" y1="13" x2="17" y2="7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="13" x2="22" y2="7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="27" y1="13" x2="27" y2="7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="17" y1="31" x2="17" y2="37" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="31" x2="22" y2="37" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="27" y1="31" x2="27" y2="37" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="17" x2="7" y2="17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="22" x2="7" y2="22" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="27" x2="7" y2="27" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="31" y1="17" x2="37" y2="17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="31" y1="22" x2="37" y2="22" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="31" y1="27" x2="37" y2="27" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/></svg>
  const PRINT = <svg width="36" height="36" viewBox="0 0 44 44" fill="none"><rect x="4" y="18" width="36" height="15" rx="3" stroke="var(--primary)" strokeWidth="2"/><path d="M12 18V13a2 2 0 012-2h16a2 2 0 012 2v5" stroke="var(--primary)" strokeWidth="2"/><rect x="13" y="23" width="18" height="10" rx="1.5" stroke="var(--primary)" strokeWidth="1.5"/><circle cx="36" cy="26" r="2.5" fill="var(--primary)" opacity=".8"/><line x1="18" y1="27" x2="27" y2="27" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="22" y1="13" x2="22" y2="5" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><path d="M18 9l4-4 4 4" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  const GEAR = <svg width="36" height="36" viewBox="0 0 40 40" fill="none"><path d="M20 6l2.5 1.5 2-1 2 2-1 2L27 13v4l-1.5 2.5 1 2-2 2-2-1L20 24l-2.5-1.5-2 1-2-2 1-2L13 17v-4l1.5-2.5-1-2 2-2 2 1z" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/><circle cx="20" cy="17" r="4" stroke="var(--primary)" strokeWidth="2"/><circle cx="31" cy="28" r="4" stroke="var(--primary)" strokeWidth="1.5"/><circle cx="31" cy="28" r="1.5" fill="var(--primary)"/><line x1="31" y1="22" x2="31" y2="20" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="31" y1="34" x2="31" y2="36" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="25" y1="28" x2="23" y2="28" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="37" y1="28" x2="35" y2="28" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/></svg>

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Despre TechNest</h1>
        <p className="page-subtitle">Pasiunea pentru tehnologie, pusă la dispoziția ta</p>
      </div>
      <section className="about-section">
        <h2 className="section-title">Ce Oferim</h2>
        <div className="services-grid">
          {[
            { icon: SPOOL, t: 'Filamente 3D', d: 'Peste 150 de variante, partener oficial Depozitul de Filamente Bistrița' },
            { icon: CHIP, t: 'Componente Electronice', d: 'Arduino, Raspberry Pi, senzori și module de calitate superioară' },
            { icon: PRINT, t: 'Print 3D la Comandă', d: 'Servicii personalizate de printare 3D în 24-48 ore' },
            { icon: GEAR, t: 'Piese Imprimante 3D', d: 'Duze, hotend-uri, curele, rulmenți și alte piese de schimb pentru imprimante 3D' },
          ].map(s => (
            <div key={s.t} className="service-item">
              <div className="service-icon" style={{ marginBottom: '1rem' }}>{s.icon}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="about-section">
        <h2 className="section-title">📋 Date Legale</h2>
        <div className="company-info-grid">
          <div className="info-card">
            <h3>🏢 Date Societate</h3>
            {[
              ['Denumire', 'TECHNEST PROTOTYPING S.R.L.'],
              ['CUI', '52582106'],
              ['Nr. Reg. Com.', 'J2025073596003'],
              ['Cod CAEN', '4791 - Comerț cu amănuntul prin Internet'],
              ['Adresa Sediu', 'Str. Măgura 3 Timis, 300763'],
            ].map(([k, v]) => (
              <div key={k} className="info-item"><span className="info-label">{k}:</span><span className="info-value">{v}</span></div>
            ))}
          </div>
          <div className="info-card">
            <h3>📞 Date de Contact</h3>
            {[
              ['Telefon', '0754 545 800 / 0760 115 729'],
              ['Email', 'technest.prototyping@gmail.com'],
              ['Adresă Magazin', 'Timișoara, 3 August 1919, nr. 21'],
              ['Program', 'Luni–Vineri: 16:00–22:00'],
            ].map(([k, v]) => (
              <div key={k} className="info-item"><span className="info-label">{k}:</span><span className="info-value">{v}</span></div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}