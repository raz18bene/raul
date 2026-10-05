import { ImageResponse } from 'next/og'

// Imaginea afisata cand linkul site-ului e distribuit pe Facebook / WhatsApp / LinkedIn etc.
export const alt = 'TechNest — Filamente 3D, componente electronice, piese imprimante 3D'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0a0e27', color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', fontSize: 120, fontWeight: 800 }}>
          <span>Tech</span>
          <span style={{ color: '#00d9ff' }}>Nest</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 38, color: '#a0aec0' }}>
          Filamente 3D · Componente electronice · Piese imprimante 3D
        </div>
        <div style={{ marginTop: 16, fontSize: 30, color: '#00d9ff' }}>
          technestprototyping.ro
        </div>
      </div>
    ),
    { ...size }
  )
}
