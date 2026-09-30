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
// Cheie fixă (tool/wrench) — piese de schimb și reparații, mai clar decât vechea
// rotiță care semăna cu un ceas și nu spunea nimic despre "piese de schimb".
// Coordonatele sunt path-ul standard de cheie (viewBox 24x24), redimensionat automat
// la 44x44 prin viewBox — nu sunt inventate manual, ca sa nu iasa o forma stricata.
const GEAR_SVG = (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
    <path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      stroke="var(--primary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
    />
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
            { href: '/filamente', icon: SPOOL_SVG, title: 'Filamente 3D', desc: 'Peste 150 de variante' },
            { href: '/componente', icon: CHIP_SVG, title: 'Componente', desc: 'Electronice de calitate' },
            { href: '/print3d', icon: PRINT_SVG, title: 'Print 3D Custom', desc: 'La comandă în 24-48h' },
            { href: '/accesorii', icon: GEAR_SVG, title: 'Piese Imprimante 3D', desc: 'Piese de schimb' },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="grid-item"
              style={{ animationDelay: `${0.7 + i * 0.1}s`, cursor: 'pointer' }}
            >
              <div className="item-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </Link>
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
            { n: '03', t: 'Servicii Custom', d: 'Print 3D personalizat și piese de schimb pentru imprimante 3D.' },
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
            { href: '/accesorii', icon: GEAR_SVG, t: 'Piese Imprimante 3D', d: 'Duze, hotend-uri, curele, rulmenți și alte piese de schimb pentru imprimante 3D.' },
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
