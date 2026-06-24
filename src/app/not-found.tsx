import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '6rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>404</div>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '2rem', marginBottom: '1rem' }}>Pagina nu a fost găsită</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Pagina pe care o cauți nu există sau a fost mutată.</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-primary">Acasă</Link>
        <Link href="/filamente" className="btn btn-secondary">Filamente</Link>
      </div>
    </div>
  )
}
