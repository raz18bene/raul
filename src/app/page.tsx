import Link from 'next/link'
import { SpoolIcon, ChipIcon, PrintIcon, GearIcon } from '@/components/ui/CategoryIcons'

const SPOOL_SVG = <SpoolIcon size={44} />
const CHIP_SVG = <ChipIcon size={44} />
const PRINT_SVG = <PrintIcon size={44} />
const GEAR_SVG = <GearIcon size={44} />

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
