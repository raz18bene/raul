'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Locker } from '@/types'

// Harta cu easybox-urile si punctele de livrare SameDay.
// Foloseste Leaflet + OpenStreetMap (gratuit) si lista oficiala de pe API-ul SameDay
// (/api/sameday?action=lockers). Folosita atat in checkout (client), cat si in admin.

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (locker: Locker) => void
  selectedId?: number | null
  title?: string
  // true = fereastra mai mare (panoul de admin)
  large?: boolean
  // Cautare precompletata (ex. orasul clientului) ca harta sa porneasca langa adresa lui
  initialQuery?: string
}

// Lista se descarca o singura data pe sesiune si ramane in memorie
let lockersMemo: Locker[] | null = null

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function EasyboxMap({ open, onClose, onSelect, selectedId, title, large, initialQuery }: Props) {
  const [lockers, setLockers] = useState<Locker[]>(lockersMemo || [])
  const [loading, setLoading] = useState(!lockersMemo)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Locker | null>(null)
  const [geoMsg, setGeoMsg] = useState('')

  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)            // instanta Leaflet
  const markersRef = useRef<Map<number, any>>(new Map())
  const selectedRef = useRef<number | null>(null)

  // 1) Descarca lista de easybox-uri (o singura data)
  useEffect(() => {
    if (!open || lockersMemo) return
    let cancelled = false
    setLoading(true)
    setError('')
    fetch('/api/sameday?action=lockers')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (d?.ok && Array.isArray(d.lockers) && d.lockers.length) {
          lockersMemo = d.lockers as Locker[]
          setLockers(lockersMemo)
        } else {
          setError(d?.error || 'Lista de easybox-uri nu a putut fi încărcată. Încearcă din nou în câteva momente.')
        }
      })
      .catch(() => { if (!cancelled) setError('Nu am putut încărca easybox-urile. Verifică conexiunea și încearcă din nou.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open])

  // La deschidere, porneste cu easybox-ul deja ales (daca exista)
  useEffect(() => {
    if (!open) return
    setQuery(selectedId ? '' : (initialQuery || ''))
    setGeoMsg('')
    setSelected(selectedId ? (lockers.find(l => l.id === selectedId) || null) : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Inchide cu Escape + blocheaza scroll-ul paginii din spate
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  // 2) Construieste harta cand avem lista si containerul e pe ecran
  useEffect(() => {
    if (!open || !lockers.length || !mapEl.current) return
    let cancelled = false
    ;(async () => {
      const mod: any = await import('leaflet')
      const L = mod.default ?? mod
      if (cancelled || !mapEl.current) return

      const map = L.map(mapEl.current, { preferCanvas: true, zoomControl: true }).setView([45.9, 24.9], 7)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      markersRef.current = new Map()
      lockers.forEach(l => {
        const m = L.circleMarker([l.lat, l.lng], {
          radius: 6, color: '#ffffff', weight: 1, fillColor: '#e11d2e', fillOpacity: 0.95,
        }).addTo(map)
        m.bindTooltip(l.name)
        m.on('click', () => setSelected(l))
        markersRef.current.set(l.id, m)
      })
      mapRef.current = { L, map }

      // Containerul e animat/afisat tarziu — recalculam dimensiunea
      setTimeout(() => map.invalidateSize(), 60)

      // Daca era deja ales un easybox, centreaza pe el
      const pre = selectedId ? lockers.find(l => l.id === selectedId) : null
      if (pre) map.setView([pre.lat, pre.lng], 14)
    })()
    return () => {
      cancelled = true
      if (mapRef.current) { mapRef.current.map.remove(); mapRef.current = null }
      markersRef.current = new Map()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lockers])

  // 3) Evidentiaza easybox-ul selectat pe harta
  useEffect(() => {
    const prevId = selectedRef.current
    if (prevId && markersRef.current.get(prevId)) {
      markersRef.current.get(prevId).setStyle({ radius: 6, fillColor: '#e11d2e', color: '#ffffff', weight: 1 })
    }
    selectedRef.current = selected?.id ?? null
    if (selected && markersRef.current.get(selected.id) && mapRef.current) {
      const m = markersRef.current.get(selected.id)
      m.setStyle({ radius: 11, fillColor: '#00d9ff', color: '#000000', weight: 2 })
      m.bringToFront()
    }
  }, [selected, lockers, open])

  // Cautare dupa oras / strada / nume
  const searchIndex = useMemo(() => lockers.map(l => ({ l, text: norm(`${l.name} ${l.address} ${l.city} ${l.county} ${l.postalCode || ''}`) })), [lockers])
  const results = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return []
    const terms = q.split(/\s+/)
    return searchIndex.filter(x => terms.every(t => x.text.includes(t))).map(x => x.l)
  }, [query, searchIndex])

  // Cand cauti, harta se muta singura peste rezultate
  useEffect(() => {
    const ctx = mapRef.current
    if (!ctx || results.length === 0) return
    const pts = results.slice(0, 300).map(l => [l.lat, l.lng])
    if (pts.length === 1) ctx.map.setView(pts[0], 15)
    else ctx.map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 })
  }, [results])

  function pick(l: Locker) {
    setSelected(l)
    if (mapRef.current) mapRef.current.map.setView([l.lat!, l.lng!], 15)
  }

  function useMyLocation() {
    setGeoMsg('')
    if (!navigator.geolocation) { setGeoMsg('Browserul nu permite localizarea.'); return }
    navigator.geolocation.getCurrentPosition(
      pos => { if (mapRef.current) mapRef.current.map.setView([pos.coords.latitude, pos.coords.longitude], 13) },
      () => setGeoMsg('Nu am putut afla locația ta. Caută după oraș în caseta de mai sus.'),
      { timeout: 8000 }
    )
  }

  if (!open) return null

  return (
    <div className="eb-overlay" role="dialog" aria-modal="true" aria-label={title || 'Alege easybox'} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`eb-modal ${large ? 'eb-modal-large' : ''}`}>
        <div className="eb-header">
          <strong>{title || '📦 Alege easybox-ul pentru livrare'}</strong>
          <button type="button" className="eb-close" onClick={onClose} aria-label="Închide">✕</button>
        </div>

        <div className="eb-body">
          <div className="eb-side">
            <input
              className="eb-search"
              placeholder="🔍 Caută oraș, stradă sau nume easybox..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            <button type="button" className="eb-geo" onClick={useMyLocation}>📍 Lângă mine</button>
            {geoMsg && <p className="eb-note">{geoMsg}</p>}

            <div className="eb-list">
              {loading && <p className="eb-note">Se încarcă easybox-urile...</p>}
              {error && <p className="eb-note" style={{ color: 'var(--error)' }}>{error}</p>}
              {!loading && !error && !query.trim() && (
                <p className="eb-note">Scrie orașul sau strada ta, sau apasă pe un punct roșu de pe hartă. {lockers.length > 0 && `(${lockers.length} puncte disponibile)`}</p>
              )}
              {query.trim() && results.length === 0 && !loading && <p className="eb-note">Niciun easybox găsit pentru „{query}”.</p>}
              {results.slice(0, 60).map(l => (
                <button type="button" key={l.id} className={`eb-item ${selected?.id === l.id ? 'active' : ''}`} onClick={() => pick(l)}>
                  <strong>{l.name}</strong>
                  <span>{l.address}, {l.city}, {l.county}</span>
                </button>
              ))}
              {results.length > 60 && <p className="eb-note">Se afișează primele 60 din {results.length}. Precizează căutarea.</p>}
            </div>
          </div>

          <div className="eb-mapwrap">
            <div ref={mapEl} className="eb-map" />
          </div>
        </div>

        <div className="eb-footer">
          {selected ? (
            <>
              <div className="eb-chosen">
                <strong>{selected.name}</strong>
                <span>{selected.address}, {selected.city}, {selected.county} {selected.postalCode}</span>
                <span style={{ opacity: 0.7 }}>ID punct SameDay: {selected.id}</span>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => { onSelect(selected); onClose() }}>
                ✔ Alege acest easybox
              </button>
            </>
          ) : (
            <span className="eb-note" style={{ margin: 0 }}>Alege un easybox de pe hartă sau din listă.</span>
          )}
        </div>
      </div>
    </div>
  )
}
