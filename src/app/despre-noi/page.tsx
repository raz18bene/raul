import { SpoolIcon, ChipIcon, PrintIcon, GearIcon } from '@/components/ui/CategoryIcons'

export default function DespreNoiPage() {
  const SPOOL = <SpoolIcon />
  const CHIP = <ChipIcon />
  const PRINT = <PrintIcon />
  const GEAR = <GearIcon />

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
            { icon: PRINT, t: 'Print 3D la Comandă', d: 'Servicii personalizate de printare 3D, cu termen estimat în funcție de proiect' },
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