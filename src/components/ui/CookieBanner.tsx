'use client'
import { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('tn_cookies')
    if (!accepted) setShow(true)
  }, [])

  function accept() {
    localStorage.setItem('tn_cookies', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="cookie-banner">
      <p>
        Folosim cookie-uri esențiale pentru funcționarea site-ului.{' '}
        <a href="/politica-confidentialitate" style={{ color: 'var(--primary)' }}>Politica de confidențialitate</a>
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button className="btn btn-primary btn-sm" onClick={accept}>Accept</button>
      </div>
    </div>
  )
}
