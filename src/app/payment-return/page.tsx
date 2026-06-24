'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function PaymentContent() {
  const params = useSearchParams()
  const order = params.get('order')
  const method = params.get('method')

  const isCard = !method || method === 'card'

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--success)', fontSize: '2rem', marginBottom: '1rem' }}>
        Comandă Plasată!
      </h1>
      {order && (
        <p style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
          Nr. comandă: <strong>{order}</strong>
        </p>
      )}
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.7 }}>
        {isCard
          ? 'Plata a fost procesată cu succes. Vei primi un email de confirmare în scurt timp.'
          : method === 'transfer'
          ? 'Vei primi detaliile pentru transfer bancar pe email în scurt timp.'
          : 'Vei plăti la livrare sau la ridicarea de la sediu.'}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
        Întrebări? Scrie-ne la{' '}
        <a href="mailto:technest.prototyping@gmail.com" style={{ color: 'var(--primary)' }}>
          technest.prototyping@gmail.com
        </a>
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-primary">Acasă</Link>
        <Link href="/filamente" className="btn btn-secondary">Continuă Cumpărăturile</Link>
      </div>
    </div>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="loading-state"><div className="spinner" /></div>}>
      <PaymentContent />
    </Suspense>
  )
}
