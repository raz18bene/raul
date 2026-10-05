'use client'

import { usePathname } from 'next/navigation'

// Buton plutitor de contact pe WhatsApp, in dreapta jos, pe toate paginile site-ului
// in afara de panoul de admin (acolo ar acoperi widget-urile de ajutor).
const WHATSAPP_NUMBER = '40754545800' // 0754 545 800, in format international fara "+"
const WHATSAPP_MESSAGE = 'Bună! Am o întrebare despre produsele TechNest.'

export default function WhatsAppButton() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Scrie-ne pe WhatsApp"
      title="Scrie-ne pe WhatsApp"
      className="whatsapp-float"
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"
          stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"
        />
        <path
          d="M9.2 8.4c.2-.4.5-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.2-.1.3 0 .5.5.9 1.3 1.6 2.3 2.1.2.1.4.1.5-.1l.7-.8c.2-.2.4-.2.6-.1l1.5.7c.2.1.3.3.3.5 0 .6-.4 1.3-1.1 1.6-.6.3-1.4.3-2.3 0-1.9-.7-3.4-2-4.3-3.7-.6-1-.9-2.2-.1-3.2z"
          fill="#fff"
        />
      </svg>
    </a>
  )
}
