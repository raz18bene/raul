import Link from 'next/link'

const SPOOL_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="16" stroke="var(--primary)" strokeWidth="2"/>
    <circle cx="20" cy="20" r="7" stroke="var(--primary)" strokeWidth="2"/>
    <circle cx="20" cy="20" r="3" fill="var(--primary)"/>
    <path d="M20 4C20 4 28 8 33 16" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M33 16C37 22 36 30 32 35" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
  </svg>
)
const CHIP_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect x="12" y="12" width="16" height="16" rx="2" stroke="var(--primary)" strokeWidth="2"/>
    <rect x="16" y="16" width="8" height="8" rx="1" fill="var(--primary)" fillOpacity=".25"/>
    <line x1="16" y1="12" x2="16" y2="6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="12" x2="20" y2="6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="24" y1="12" x2="24" y2="6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="16" y1="28" x2="16" y2="34" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="28" x2="20" y2="34" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="24" y1="28" x2="24" y2="34" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="16" x2="6" y2="16" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="24" x2="6" y2="24" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="28" y1="16" x2="34" y2="16" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="28" y1="24" x2="34" y2="24" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const PRINT_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect x="6" y="14" width="28" height="14" rx="3" stroke="var(--primary)" strokeWidth="2"/>
    <path d="M11 14V10a2 2 0 012-2h14a2 2 0 012 2v4" stroke="var(--primary)" strokeWidth="2"/>
    <rect x="11" y="20" width="18" height="8" rx="1" stroke="var(--primary)" strokeWidth="1.5"/>
    <circle cx="30" cy="21" r="2" fill="var(--primary)"/>
    <line x1="15" y1="24" x2="25" y2="24" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="20" y1="10" x2="20" y2="4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 7l3-3 3 3" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const GEAR_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M20 6l2.5 1.5 2-1 2 2-1 2L27 13v4l-1.5 2.5 1 2-2 2-2-1L20 24l-2.5-1.5-2 1-2-2 1-2L13 17v-4l1.5-2.5-1-2 2-2 2 1z" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="20" cy="17" r="4" stroke="var(--primary)" strokeWidth="2"/>
    <circle cx="31" cy="28" r="4" stroke="var(--primary)" strokeWidth="1.5"/>
    <circle cx="31" cy="28" r="1.5" fill="var(--primary)"/>
    <line x1="31" y1="22" x2="31" y2="20" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="31" y1="34" x2="31" y2="36" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="25" y1="28" x2="23" y2="28" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="37" y1="28" x2="35" y2="28" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-section animate-fade">
        <div>
          <h1 className="hero-title">
            <span>Transformăm</span>
            <span className="hero-highlight">Idei în Realitate</span>
          </h1>
          <p className="hero-description">
            Furnizor complet de filamente premium, componente electronice și servicii de fabricație digitală. De la concept la produs finit.
          </p>
          <div className="hero-cta">
            <Link href="/filamente" className="btn btn-primary">Explorează Produsele →</Link>
            <Link href="/contact" className="btn btn-secondary">Contact Rapid</Link>
          </div>
        </div>

        <div className="visual-grid">
          {[
            { icon: SPOOL_SVG, title: 'Filamente 3D', desc: 'Peste 150 de variante' },
            { icon: CHIP_SVG, title: 'Componente', desc: 'Electronice de calitate' },
            { icon: PRINT_SVG, title: 'Print 3D Custom', desc: 'La comandă în 24-48h' },
          ].map((item, i) => (
            <div key={i} className="grid-item" style={{ animationDelay: `${0.7 + i * 0.1}s` }}>
              <div className="item-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ marginBottom: '5rem' }}>
        <h2 className="section-title">De ce TechNest?</h2>
        <div className="features-grid">
          {[
            { n: '01', t: 'Livrare Rapidă', d: 'Comenzi procesate în aceeași zi. Livrare în toată țara în 24-48h.' },
            { n: '02', t: 'Stoc Permanent', d: 'Mii de produse disponibile imediat. Stoc actualizat în timp real.' },
            { n: '03', t: 'Servicii Custom', d: 'Print 3D și gravare laser personalizate după specificațiile tale.' },
            { n: '04', t: 'Suport Tehnic', d: 'Echipă dedicată pentru consultanță și suport complet.' },
          ].map(f => (
            <div key={f.n} className="feature-card">
              <div className="feature-number">{f.n}</div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="section-title">Explorează Categoriile</h2>
        <div className="category-grid">
          {[
            { href: '/filamente', icon: SPOOL_SVG, t: 'Filamente 3D', d: 'Peste 150 de variante de filamente premium. Partener oficial Depozitfilament.ro.' },
            { href: '/componente', icon: CHIP_SVG, t: 'Componente Electronice', d: 'Componente de calitate compatibile cu Arduino, Raspberry Pi și altele.' },
            { href: '/print3d', icon: PRINT_SVG, t: 'Print 3D Custom', d: 'Printare la comandă în 24-48h. Trimite fișierul tău și primești ofertă personalizată.' },
          ].map(c => (
            <Link key={c.href} href={c.href} className="category-card">
              <div className="category-icon">{c.icon}</div>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
              <span className="category-link">Vezi produsele →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
