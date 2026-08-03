import Link from 'next/link'

const SPOOL_SVG = (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <circle cx="22" cy="22" r="18" stroke="var(--primary)" strokeWidth="2"/>
    <circle cx="22" cy="22" r="18" stroke="var(--primary)" strokeWidth="2" strokeDasharray="4 2" opacity="0.3"/>
    <ellipse cx="22" cy="22" rx="7" ry="7" stroke="var(--primary)" strokeWidth="2"/>
    <ellipse cx="22" cy="22" rx="3" ry="3" fill="var(--primary)"/>
    <line x1="22" y1="4" x2="22" y2="15" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="22" y1="29" x2="22" y2="40" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 4 Q36 10 40 22" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
)
const CHIP_SVG = (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="13" y="13" width="18" height="18" rx="3" stroke="var(--primary)" strokeWidth="2"/>
    <rect x="17" y="17" width="10" height="10" rx="2" stroke="var(--primary)" strokeWidth="1.5" fill="var(--primary)" fillOpacity=".15"/>
    <line x1="17" y1="13" x2="17" y2="7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="22" y1="13" x2="22" y2="7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="27" y1="13" x2="27" y2="7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="17" y1="31" x2="17" y2="37" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="22" y1="31" x2="22" y2="37" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="27" y1="31" x2="27" y2="37" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="13" y1="17" x2="7" y2="17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="13" y1="22" x2="7" y2="22" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="13" y1="27" x2="7" y2="27" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="31" y1="17" x2="37" y2="17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="31" y1="22" x2="37" y2="22" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="31" y1="27" x2="37" y2="27" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const PRINT_SVG = (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <path d="M22 6L8 14v16l14 8 14-8V14L22 6z" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M8 14l14 8 14-8" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/>
    <line x1="22" y1="22" x2="22" y2="38" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="22" y1="16" x2="22" y2="20" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
)
const LASER_SVG = (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="var(--primary)" strokeWidth="2"/>
    <line x1="21" y1="12" x2="41" y2="12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="41" cy="12" r="2" fill="var(--primary)"/>
    <line x1="41" y1="12" x2="35" y2="32" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" opacity="0.6"/>
    <line x1="41" y1="12" x2="41" y2="32" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="41" y1="12" x2="47" y2="32" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" opacity="0.6"/>
    <line x1="28" y1="36" x2="54" y2="36" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
    <line x1="7" y1="9" x2="7" y2="11" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <line x1="12" y1="9" x2="12" y2="11" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <rect x="5" y="8" width="14" height="8" rx="1" fill="var(--primary)" opacity="0.08"/>
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
            { icon: LASER_SVG, title: 'Gravare Laser', desc: 'Precizie maximă' },
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
            { href: '/laser', icon: LASER_SVG, t: 'Gravare Laser', d: 'Personalizare pe lemn, plexiglas, MDF cu precizie maximă.' },
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
