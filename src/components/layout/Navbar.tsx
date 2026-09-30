'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useTheme } from '@/hooks/useTheme'
import { useState } from 'react'

const links = [
  { href: '/', label: 'Acasă' },
  { href: '/despre-noi', label: 'Despre Noi' },
  { href: '/filamente', label: 'Filamente' },
  { href: '/componente', label: 'Componente' },
  { href: '/print3d', label: 'Print 3D' },
  { href: '/accesorii', label: 'Piese Imprimante 3D' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { count } = useCart()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* Logo - fixed top left */}
      <div className="logo-corner">
        <Link href="/" className="logo-text">
          Tech<span className="logo-accent">Nest</span>
        </Link>
      </div>

      <nav className="main-nav">
        <div className="nav-container">
          {/* Desktop links */}
          <ul className="nav-links">
            {links.map(l => (
              <li key={l.href}>
                <Link href={l.href} className={`nav-link ${pathname === l.href ? 'active' : ''}`}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop right side */}
          <div className="nav-right">
            <button className="theme-btn" onClick={toggle} title="Schimbă tema" aria-label="Toggle theme">
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <Link href="/checkout" className="cart-btn">
              🛒 Coș <span className="cart-count">{count}</span>
            </Link>
            <Link href="/cont" className="admin-btn" title="Contul meu">
              👤
            </Link>
            <Link href="/admin" className="admin-btn" title="Admin Panel">
              🛠️
            </Link>
          </div>

          {/* Mobile: theme + cart + hamburger */}
          <div className="mobile-nav-right">
            <button className="theme-btn" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <Link href="/checkout" className="cart-btn">
              🛒 <span className="cart-count">{count}</span>
            </Link>
            <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--bg-overlay)', zIndex: 1000,
            display: 'flex', flexDirection: 'column',
            paddingTop: '5rem', paddingLeft: '2rem', paddingRight: '2rem',
            gap: '0.25rem',
          }}
        >
          <button
            onClick={() => setMenuOpen(false)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}
          >✕</button>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600,
                color: pathname === l.href ? 'var(--primary)' : 'var(--text-primary)',
                textDecoration: 'none', padding: '0.9rem 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/cont"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600,
              color: 'var(--text-secondary)', textDecoration: 'none', padding: '0.9rem 0',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            👤 Contul meu
          </Link>
          <Link
            href="/admin"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600,
              color: 'var(--text-secondary)', textDecoration: 'none', padding: '0.9rem 0',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            🛠️ Admin Panel
          </Link>
        </div>
      )}
    </>
  )
}
