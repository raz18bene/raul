import { ImageResponse } from 'next/og'

// Favicon generat din cod (Google cere un favicon multiplu de 48px pentru rezultatele de cautare).
export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0a0e27', color: '#00d9ff', fontSize: 26, fontWeight: 800, borderRadius: 10,
        }}
      >
        TN
      </div>
    ),
    { ...size }
  )
}
