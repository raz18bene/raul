'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import dynamicImport from 'next/dynamic'
import { Product, Order, Locker } from '@/types'

// Harta easybox — se incarca doar in browser, la cerere
const EasyboxMap = dynamicImport(() => import('@/components/shop/EasyboxMap'), { ssr: false })

function useSupabase() {
  const ref = useRef<SupabaseClient | null>(null)
  if (typeof window !== 'undefined' && !ref.current) {
    const { getSupabase } = require('@/lib/supabase')
    ref.current = getSupabase()
  }
  return ref.current
}

const safe = (v: any) => parseFloat(String(v ?? 0)) || 0

// ─── Help tooltip (iconita "?" cu explicatie) ────────────────────
function Help({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: 6 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Ajutor"
        style={{
          width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--border)',
          background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, padding: 0, flexShrink: 0,
        }}
      >?</button>
      {open && (
        <span style={{
          position: 'absolute', zIndex: 20, top: '140%', left: 0, width: 230,
          background: 'var(--bg-overlay)', border: '1px solid var(--primary)', borderRadius: 8,
          padding: '0.6rem 0.75rem', fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-secondary)',
          lineHeight: 1.5, boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

// ─── Ghid Admin (buton flotant + FAQ) ─────────────────────────────
type FaqItem = { cat: string, q: string, a: React.ReactNode }

const ADMIN_FAQS: FaqItem[] = [
  // Produse
  { cat: '📦 Produse', q: 'Cum adaug un produs nou?', a: 'Tab „Produse" → butonul „➕ Produs Nou" din dreapta sus. Completează câmpurile (apasă „?" lângă fiecare pentru explicații), adaugă poze, apoi „💾 Salvează". Produsul apare imediat pe site.' },
  { cat: '📦 Produse', q: 'Cum editez un produs existent?', a: 'În tabelul de produse, apasă pe iconița creion ✏️ din dreptul produsului. Se deschide același formular, cu datele deja completate.' },
  { cat: '📦 Produse', q: 'Cum șterg un produs?', a: 'Apasă pe iconița coș 🗑️ din tabel. Atenție: ștergerea e permanentă. Dacă vrei doar să-l ascunzi temporar de pe site, mai bine editează produsul și debifează „Activ" — rămâne salvat, dar nu mai apare în magazin.' },
  { cat: '📦 Produse', q: 'De ce nu apare un produs pe site?', a: 'Verifică pe rând: (1) e bifat „Activ" la produs? (2) are Stoc mai mare de 0? (3) e pus în categoria corectă? Oricare din astea, dacă lipsește, ascunde produsul din magazin.' },
  { cat: '📦 Produse', q: 'Cum schimb poza principală a unui produs?', a: 'Prima poză din listă e mereu poza principală (are eticheta „MAIN"). Șterge toate pozele cu ✕ și adaugă-le din nou, punând-o pe cea dorită prima.' },
  { cat: '📦 Produse', q: 'Ce înseamnă „Recomandat"?', a: 'E doar un marcaj — produsele bifate „Recomandat" pot fi scoase în evidență pe homepage sau în secțiuni speciale ale magazinului.' },
  { cat: '📦 Produse', q: 'Ce înseamnă Preț Redus?', a: 'Se completează DOAR dacă produsul e la reducere. Pe site apare prețul vechi tăiat și cel redus ca preț nou. Dacă nu e ofertă, lasă câmpul gol.' },
  // Filtre
  { cat: '🏷️ Filtre', q: 'Ce este un filtru?', a: 'O caracteristică după care clienții pot căuta produse pe site — ex: Culoare, Material, Gramaj. Fiecare filtru poate avea mai multe valori (Culoare → Alb, Negru, Roșu).' },
  { cat: '🏷️ Filtre', q: 'Cum adaug un filtru nou la mai multe produse deodată?', a: 'Tab „Filtre" → secțiunea „➕ Creează filtru nou". Scrii numele filtrului (ex: Culoare) și o valoare implicită (ex: Alb) — se adaugă la toate produsele care nu îl au încă. Apoi corectezi excepțiile individual.' },
  { cat: '🏷️ Filtre', q: 'Cum schimb filtrul doar la UN produs?', a: 'Tab „Filtre" → secțiunea „🎯 Atribuie filtru la un produs specific". Alegi produsul, apoi scrii filtrul și valoarea corectă pentru el.' },
  { cat: '🏷️ Filtre', q: 'Pot adăuga filtre direct din formularul de produs?', a: 'Da — la editarea unui produs, secțiunea „Atribute / Filtre produs" îți permite să adaugi rânduri Filtru → Valoare direct acolo, fără să mai intri în tab-ul Filtre.' },
  { cat: '🏷️ Filtre', q: 'Cum șterg un filtru?', a: 'Tab „Filtre" → în „Filtre existente": butonul „🗑️ Șterge filtrul" elimină tot filtrul (ex: toată „Culoarea") de la toate produsele. Butonul ✕ de lângă o singură valoare (ex: „Roșu") o șterge doar pe aceea.' },
  // Comenzi
  { cat: '🛒 Comenzi', q: 'Cum văd detaliile unei comenzi?', a: 'Tab „Comenzi" → click oriunde pe cardul comenzii. Se deschide fereastra cu client, adresă, produse comandate și total.' },
  { cat: '🛒 Comenzi', q: 'Cum schimb statusul unei comenzi?', a: 'În fereastra comenzii, din dropdown-ul „Status Comandă" alegi noul status (pending → processing → shipped → delivered, sau cancelled), apoi „💾 Salvează Modificările".' },
  { cat: '🛒 Comenzi', q: 'Cum generez AWB pentru livrare?', a: 'În fereastra comenzii (dacă livrarea e prin curier, nu ridicare de la sediu), apasă „🚚 Generează AWB SameDay". AWB-ul apare instant și statusul trece automat pe „shipped".' },
  // Cereri contact
  { cat: '📩 Cereri contact', q: 'Ce sunt cererile de contact?', a: 'Mesajele trimise de vizitatori prin formularele de pe site: contact general, ofertă print 3D sau cerere de retur. Apar în tab-ul „Cereri", cele mai noi primele.' },
  { cat: '📩 Cereri contact', q: 'Cum răspund unei cereri?', a: 'Click pe card ca să se extindă, apoi butonul „✉️ Răspunde pe email" îți deschide clientul de mail cu adresa deja completată.' },
  // General
  { cat: '⚙️ General', q: 'Nu mă pot loga în admin, ce fac?', a: 'Verifică emailul și parola. Dacă primești „Nu ai permisiuni de admin", contul tău există dar nu are rol de administrator setat în Supabase — trebuie schimbat acolo, din tabela de utilizatori.' },
  { cat: '⚙️ General', q: 'Ce face butonul „Sync Oblio"?', a: 'Sincronizează stocurile din contul tău Oblio cu produsele din site, ca să nu vinzi ceva ce nu mai ai fizic în stoc.' },
]

function AdminGuide() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [openQ, setOpenQ] = useState<string | null>(null)

  const filtered = ADMIN_FAQS.filter(f => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return f.q.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q) || String(f.a).toLowerCase().includes(q)
  })
  const categories = Array.from(new Set(filtered.map(f => f.cat)))

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Ghid Admin — răspunsuri la întrebări frecvente"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 3000,
          width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', color: '#000',
          border: 'none', cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
        }}
      >{open ? '✕' : '❓'}</button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 3000, width: 360, maxWidth: 'calc(100vw - 2rem)',
          maxHeight: '70vh', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 14,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}>
          <div style={{ padding: '1rem 1.1rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.6rem' }}>
              ❓ Ghid Admin
            </p>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Caută: cum fac să..."
              style={{ width: '100%', padding: '0.55rem 0.7rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

          <div style={{ overflowY: 'auto', padding: '0.5rem 0.75rem', flex: 1 }}>
            {filtered.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0.5rem' }}>
                Nicio întrebare găsită. Încearcă alți termeni, sau vezi <a href="/admin-tutorial" target="_blank" style={{ color: 'var(--primary)' }}>tutorialul complet</a>.
              </p>
            ) : categories.map(cat => (
              <div key={cat} style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.4rem 0.4rem 0.2rem' }}>{cat}</p>
                {filtered.filter(f => f.cat === cat).map(f => {
                  const isOpen = openQ === f.q
                  return (
                    <div key={f.q} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={() => setOpenQ(isOpen ? null : f.q)}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                          padding: '0.55rem 0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500, gap: '0.5rem',
                        }}
                      >
                        <span>{f.q}</span>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                      </button>
                      {isOpen && (
                        <p style={{ padding: '0 0.4rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                          {f.a}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div style={{ padding: '0.6rem 1.1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <a href="/admin-tutorial" target="_blank" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>📖 Vezi tutorialul complet, cu exemple →</a>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Label cu text + Help inline ──────────────────────────────────
function FieldLabel({ text, help }: { text: string, help?: string }) {
  return (
    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
      {text}
      {help && <Help text={help} />}
    </label>
  )
}


// ─── Image Uploader ───────────────────────────────────────────────
function ImageUploader({ images, onChange, sb }: { images: string[], onChange: (imgs: string[]) => void, sb: any }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')
    const newUrls: string[] = []
    const failMsgs: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error: uploadErr } = await sb.storage.from('products').upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadErr) {
        console.error('Eroare upload poza:', uploadErr)
        failMsgs.push(`${file.name}: ${uploadErr.message || 'eroare necunoscută'}`)
        continue
      }
      if (data) {
        const { data: url } = sb.storage.from('products').getPublicUrl(path)
        newUrls.push(url.publicUrl)
      }
    }
    if (newUrls.length) onChange([...images, ...newUrls])
    if (failMsgs.length) {
      setError(`❌ Nu s-au putut încărca ${failMsgs.length} poze: ${failMsgs.join(' · ')}`)
    }
    setUploading(false)
    e.target.value = ''
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {error && (
        <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(245,101,101,0.1)', border: '1px solid var(--error)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--error)', marginBottom: '0.6rem' }}>
          {error}
        </div>
      )}
      {/* Preview grid */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {images.map((url, idx) => (
            <div key={idx} style={{ position: 'relative', width: 80, height: 80 }}>
              <img src={url} alt={`img${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--border)' }} />
              {idx === 0 && <span style={{ position: 'absolute', top: 2, left: 2, background: 'var(--primary)', color: '#000', fontSize: '0.6rem', fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>MAIN</span>}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--error)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
      {/* Upload button */}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--bg-hover)', border: '2px dashed var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.88rem', transition: 'border-color 0.2s', width: '100%', justifyContent: 'center' }}>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={handleFiles} />
        {uploading ? '⏳ Se încarcă...' : '📷 Adaugă poze (JPG, PNG, WEBP)'}
      </label>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>📌 Prima poză din listă = poza principală (cea care apare în magazin). Trage pozele în ordinea dorită dacă vrei alta principală — sau șterge-le (✕) și adaugă-le din nou în ordinea corectă. Recomandare: poze pătrate, 800×800px, fundal curat.</p>
    </div>
  )
}

// ─── Un rand din editorul de atribute (cheie + valori multiple tip "chip") ──
function AttrRowEditor({ row, suggestions, onKeyChange, onAddValue, onRemoveValue, onRemoveRow, smallInputSty }: {
  row: { key: string, values: string[] }
  suggestions: string[]
  onKeyChange: (val: string) => void
  onAddValue: (val: string) => void
  onRemoveValue: (val: string) => void
  onRemoveRow: () => void
  smallInputSty: any
}) {
  const [newVal, setNewVal] = useState('')
  const listId = useRef(`pm-attr-vals-${Math.random().toString(36).slice(2)}`).current

  function commit() {
    if (newVal.trim()) { onAddValue(newVal); setNewVal('') }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '0.5rem' }}>
      <input
        style={{ ...smallInputSty, maxWidth: 160 }}
        value={row.key}
        onChange={e => onKeyChange(e.target.value)}
        placeholder="ex: Culoare"
        list="pm-attr-keys"
      />
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        {row.values.map(v => (
          <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', background: 'var(--bg-hover)', borderRadius: 20, fontSize: '0.8rem', color: 'var(--primary)' }}>
            {v}
            <button type="button" onClick={() => onRemoveValue(v)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.72rem', padding: 0, lineHeight: 1 }}>✕</button>
          </span>
        ))}
        <input
          style={{ ...smallInputSty, minWidth: 100, flex: '1 1 100px' }}
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
          }}
          onBlur={commit}
          placeholder={row.values.length ? '+ altă valoare...' : 'ex: Alb (Enter pt. a adăuga)'}
          list={listId}
        />
        {suggestions.length > 0 && (
          <datalist id={listId}>
            {suggestions.map(v => <option key={v} value={v} />)}
          </datalist>
        )}
      </div>
      <button
        type="button"
        onClick={onRemoveRow}
        title="Șterge acest filtru de la produs"
        style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 8, background: 'rgba(245,101,101,0.1)', color: 'var(--error)', border: '1px solid var(--error)', cursor: 'pointer', fontSize: '0.8rem' }}
      >✕</button>
    </div>
  )
}

// ─── Product Modal ────────────────────────────────────────────────
function ProductModal({ product, categories, existingAttrs, onSave, onClose, sb }: {
  product: any, categories: any[], existingAttrs: Record<string, string[]>, onSave: () => void, onClose: () => void, sb: SupabaseClient
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    sale_price: product?.sale_price || '',
    stock: product?.stock || 0,
    sku: product?.sku || '',
    category_id: product?.category_id || categories[0]?.id || '',
    is_active: product?.is_active ?? true,
    featured: product?.featured || false,
  })
  const [images, setImages] = useState<string[]>(product?.images || [])
  // Fiecare rand = un filtru (cheie) + una sau mai multe valori pentru acest produs
  // (ex: Culoare -> ["Roșu", "Albastru"], daca produsul vine in 2 culori).
  const [attrRows, setAttrRows] = useState<{ key: string, values: string[] }[]>(() => {
    const entries = Object.entries(product?.attributes || {}) as [string, string | string[]][]
    return entries.length
      ? entries.map(([key, value]) => ({ key, values: Array.isArray(value) ? value.map(String) : [String(value)] }))
      : [{ key: '', values: [] }]
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateAttrKey(idx: number, val: string) {
    setAttrRows(rows => rows.map((r, i) => i === idx ? { ...r, key: val } : r))
  }
  function addAttrRow() {
    setAttrRows(rows => [...rows, { key: '', values: [] }])
  }
  function removeAttrRow(idx: number) {
    setAttrRows(rows => rows.filter((_, i) => i !== idx))
  }
  function addAttrValue(idx: number, val: string) {
    const v = val.trim()
    if (!v) return
    setAttrRows(rows => rows.map((r, i) => (i === idx && !r.values.includes(v)) ? { ...r, values: [...r.values, v] } : r))
  }
  function removeAttrValue(idx: number, val: string) {
    setAttrRows(rows => rows.map((r, i) => i === idx ? { ...r, values: r.values.filter(v => v !== val) } : r))
  }
  // Adauga rapid un rand pentru un filtru predefinit al categoriei (daca nu exista deja)
  function quickAddCategoryKey(key: string) {
    setAttrRows(rows => {
      if (rows.some(r => r.key === key)) return rows
      const withoutEmpty = rows.filter(r => r.key.trim() || r.values.length)
      return [...withoutEmpty, { key, values: [] }]
    })
  }

  const currentCategoryFilterKeys: string[] = categories.find(c => c.id === form.category_id)?.filter_keys || []

  function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // scoate diacritice
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const attrs: Record<string, string[]> = {}
    attrRows.forEach(r => { if (r.key.trim() && r.values.length) attrs[r.key.trim()] = r.values })

    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(String(form.price)),
      sale_price: form.sale_price ? parseFloat(String(form.sale_price)) : null,
      stock: parseInt(String(form.stock)),
      sku: form.sku || null,
      category_id: form.category_id,
      is_active: form.is_active,
      featured: form.featured,
      attributes: attrs,
      images: images,
    }

    const { error: err } = product?.id
      ? await sb.from('products').update(data).eq('id', product.id)
      : await sb.from('products').insert({
          ...data,
          // "slug" e obligatoriu si unic in baza de date — il generam din nume + un cod scurt aleator,
          // ca sa nu se blocheze salvarea daca exista deja alt produs cu nume identic/similar
          slug: `${slugify(form.name)}-${Math.random().toString(36).slice(2, 7)}`,
        })

    if (err) { setError(err.message); setSaving(false); return }
    onSave()
  }

  const inp = (label: string, key: string, type = 'text', props: any = {}, help?: string) => (
    <div className="form-group">
      <FieldLabel text={label} help={help} />
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', width: '100%', outline: 'none' }}
        {...props}
      />
    </div>
  )

  const smallInputSty: any = { padding: '0.55rem 0.65rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', width: '100%', outline: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.2rem' }}>
            {product?.id ? '✏️ Editează Produs' : '➕ Produs Nou'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Câmpurile cu * sunt obligatorii. Apasă pe fiecare „?" pentru explicații.
        </p>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {inp('Nume Produs *', 'name', 'text', { required: true }, 'Numele produsului, exact cum vrei să apară pe site și în comenzi/facturi. Ex: „PLA Alb 1kg".')}
          <div className="form-group">
            <FieldLabel text="Descriere" help="Textul care apare pe pagina produsului, sub imagini. Poți descrie materialul, folosirea recomandată, dimensiuni etc. Nu e obligatoriu, dar ajută clientul să decidă." />
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', width: '100%', resize: 'vertical', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {inp('Preț (RON) *', 'price', 'number', { required: true, step: '0.01', min: '0' }, 'Prețul normal de vânzare, în lei, fără TVA scris separat (prețul afișat este prețul final).')}
            {inp('Preț Redus (RON)', 'sale_price', 'number', { step: '0.01', min: '0' }, 'Completează DOAR dacă produsul e la reducere. Pe site va apărea prețul vechi tăiat și acesta ca preț nou. Lasă gol dacă nu e ofertă.')}
            {inp('Stoc *', 'stock', 'number', { required: true, min: '0' }, 'Câte bucăți ai disponibile în acest moment. Când ajunge la 0, produsul apare „Stoc epuizat" pe site.')}
            {inp('SKU', 'sku', 'text', {}, 'Cod intern de produs (opțional), util pentru gestiune/facturare. Dacă nu ai un sistem de coduri, poți lăsa gol.')}
          </div>
          <div className="form-group">
            <FieldLabel text="Categorie" help="Secțiunea din magazin în care va apărea produsul (ex: Filamente 3D, Componente Electronice). Alege categoria potrivită, altfel produsul nu va fi găsit pe pagina corectă." />
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', width: '100%' }}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <FieldLabel text="Poze Produs" help="Adaugă una sau mai multe poze cu produsul. Prima poză adăugată devine automat poza principală (cea din listă/cataloage)." />
            <ImageUploader images={images} onChange={setImages} sb={sb} />
          </div>

          {/* Atribute / Filtre — editor tip randuri, cu mai multe valori per filtru */}
          <div className="form-group">
            <FieldLabel text="Atribute / Filtre produs" help='Aici spui ce caracteristici are ACEST produs — de ex. Culoare = Alb, Material = PLA. Acestea devin automat filtrele pe care le văd și le pot bifa clienții pe pagina de produse (vezi și tab-ul "🏷️ Filtre" din admin). Poți adăuga mai multe valori la același filtru (ex. produsul vine în 2 culori) — scrie o valoare și apasă Enter.' />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '-0.15rem 0 0.5rem' }}>
              Fiecare rând = un filtru (ex: <em>Culoare</em>) și una sau mai multe valori pentru acest produs (ex: <em>Roșu</em>, <em>Albastru</em>). Scrie o valoare și apasă Enter ca s-o adaugi.
            </p>
            {currentCategoryFilterKeys.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0 0 0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Filtre pentru această categorie:</span>
                {currentCategoryFilterKeys.map(k => {
                  const already = attrRows.some(r => r.key === k)
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => quickAddCategoryKey(k)}
                      disabled={already}
                      style={{
                        padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.78rem', cursor: already ? 'default' : 'pointer',
                        background: already ? 'rgba(72,187,120,0.1)' : 'var(--bg-hover)',
                        color: already ? 'var(--success)' : 'var(--text-secondary)',
                        border: `1px solid ${already ? 'var(--success)' : 'var(--border)'}`,
                      }}
                    >{already ? `✓ ${k}` : `+ ${k}`}</button>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {attrRows.map((row, i) => (
                <AttrRowEditor
                  key={i}
                  row={row}
                  suggestions={existingAttrs[row.key] || []}
                  onKeyChange={val => updateAttrKey(i, val)}
                  onAddValue={val => addAttrValue(i, val)}
                  onRemoveValue={val => removeAttrValue(i, val)}
                  onRemoveRow={() => removeAttrRow(i)}
                  smallInputSty={smallInputSty}
                />
              ))}
              <datalist id="pm-attr-keys">
                {Object.keys(existingAttrs).map(k => <option key={k} value={k} />)}
              </datalist>
              <button
                type="button"
                onClick={addAttrRow}
                style={{ padding: '0.5rem 0.9rem', background: 'var(--bg-hover)', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', width: 'fit-content' }}
              >+ Adaugă atribut</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Activ
              <Help text="Dacă e bifat, produsul apare pe site și poate fi cumpărat. Dacă îl debifezi, produsul rămâne salvat în admin dar dispare din magazin (util când vrei să-l ascunzi temporar, fără să-l ștergi)." />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
              Recomandat
              <Help text="Produsele bifate ca „Recomandat” pot fi scoase în evidență pe homepage sau în secțiuni speciale ale magazinului." />
            </label>
          </div>
          {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.7rem', background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Anulă</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.7rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {saving ? '⏳ Se salvează...' : '💾 Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ─── Order Detail Modal ───────────────────────────────────────────
function OrderModal({ order, onClose, onUpdate, onDelete, sb }: { order: any, onClose: () => void, onUpdate: () => void, onDelete: () => void, sb: SupabaseClient }) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [awbLoading, setAwbLoading] = useState(false)
  // Easybox ales de client (sau schimbat de admin) + bifa "predam noi la un punct SameDay"
  const [locker, setLocker] = useState<Locker | null>(order.shipping_address?.locker || null)
  const [mapOpen, setMapOpen] = useState(false)
  // Comenzile in easybox: implicit bifat "predare personala" (ducem noi coletul la un punct SameDay).
  // Debifat = SameDay trimite curierul sa ridice coletul de la voi.
  const [personalHandover, setPersonalHandover] = useState(order.shipping_method === 'easybox')
  const [shippingMethod, setShippingMethod] = useState<string>(order.shipping_method || 'sameday')
  const [invoice, setInvoice] = useState<any>(order.invoice || null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  // Emite factura in Oblio direct din datele comenzii (PF/PJ, produse, transport)
  async function generateInvoice() {
    if (!confirm('Emit factura în Oblio pentru comanda ' + order.order_number + '? Factura nu se poate anula de aici.')) return
    setInvoiceLoading(true)
    try {
      const { data: sess } = await sb.auth.getSession()
      const r = await fetch('/api/oblio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-invoice', orderId: order.id, accessToken: sess?.session?.access_token || '' }),
      })
      const d = await r.json()
      if (d.success) {
        setInvoice(d.invoice)
        order.invoice = d.invoice
        alert(`✅ Factură emisă: ${d.invoice.series} ${d.invoice.number}`)
        onUpdate()
      } else {
        alert('❌ ' + (d.error || 'Eroare necunoscută la emiterea facturii.'))
      }
    } catch (e: any) {
      alert('❌ ' + (e.message || 'Eroare de rețea.'))
    }
    setInvoiceLoading(false)
  }

  // Admin alege / schimba easybox-ul: salvam imediat pe comanda (adresa de livrare devine adresa easybox-ului)
  async function changeLocker(l: Locker) {
    // Pastram adresa clientului (e nevoie la AWB si pentru contact); doar adaugam easybox-ul ales
    const newAddr = { ...(order.shipping_address || {}), locker: l }
    const { error } = await sb.from('orders').update({ shipping_address: newAddr, shipping_method: 'easybox' } as any).eq('id', order.id)
    if (error) { alert('❌ Nu am putut salva easybox-ul: ' + error.message); return }
    order.shipping_address = newAddr
    order.shipping_method = 'easybox'
    setLocker(l)
    if (shippingMethod !== 'easybox') setPersonalHandover(true)
    setShippingMethod('easybox')
    onUpdate()
  }

  async function saveChanges() {
    setSaving(true)
    await sb.from('orders').update({ status, payment_status: paymentStatus }).eq('id', order.id)
    setSaving(false)
    onUpdate()
  }

  async function deleteOrder() {
    if (!confirm(`Sigur ștergi comanda ${order.order_number}? Este ireversibil — folosește doar pentru comenzi de test sau neplătite pe care nu vrei să le mai păstrezi.`)) return
    setDeleting(true)
    // Sterge intai produsele comenzii (order_items), apoi comanda insasi
    await sb.from('order_items').delete().eq('order_id', order.id)
    const { error } = await sb.from('orders').delete().eq('id', order.id)
    setDeleting(false)
    if (error) { alert('❌ Eroare la ștergere: ' + error.message); return }
    onDelete()
  }

  async function generateAWB() {
    if (shippingMethod === 'easybox' && !locker) {
      alert('📦 Comanda e cu livrare prin easybox. Alege mai întâi easybox-ul cel mai apropiat de adresa clientului (butonul „Alege easybox pe hartă").')
      setMapOpen(true)
      return
    }
    setAwbLoading(true)
    const addr = order.shipping_address || {}
    // Endpoint-ul SameDay e doar pentru admin — trimitem token-ul sesiunii curente
    const { data: sess } = await sb.auth.getSession()
    const r = await fetch('/api/sameday', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-awb',
        accessToken: sess?.session?.access_token || '',
        lockerId: shippingMethod === 'easybox' && locker ? locker.id : undefined,
        personalHandover,
        orderNumber: order.order_number,
        recipientName: order.customer_name,
        recipientPhone: order.customer_phone,
        recipientEmail: order.customer_email,
        recipientAddress: addr.street || '',
        recipientCity: addr.city || '',
        recipientCounty: addr.county || '',
        recipientPostalCode: addr.postal_code || '',
        weight: 1, parcels: 1,
        // Ramburs: curierul incaseaza totalul comenzii (produse + transport) de la client
        cashOnDelivery: order.payment_method === 'ramburs' ? safe(order.total_amount) : 0,
      }),
    })
    const d = await r.json()
    if (d.success) {
      await sb.from('orders').update({ awb_number: d.awbNumber, status: 'shipped' } as any).eq('id', order.id)
      alert(`✅ AWB generat: ${d.awbNumber}`)
      onUpdate()
    } else {
      // d.error e acum un mesaj deja tradus in romana, cu exact ce camp e gresit
      // (vezi extractSamedayErrors in /api/sameday) — il afisam direct, fara JSON brut.
      alert('❌ ' + (d.error || 'Eroare necunoscută la generarea AWB.'))
    }
    setAwbLoading(false)
  }

  const addr = order.shipping_address || {}
  const statusColors: Record<string, string> = { pending: '#ed8936', processing: '#00d9ff', shipped: '#48bb78', delivered: '#48bb78', cancelled: '#f56565' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.2rem' }}>{order.order_number}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(order.created_at).toLocaleString('ro-RO')}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Client info */}
        <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>👤 {order.customer_name}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>📧 {order.customer_email}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>📞 {order.customer_phone}</p>
          {addr.street && <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.3rem' }}>📍 {addr.street}, {addr.city}, {addr.county} {addr.postal_code}</p>}
          {order.billing?.type === 'pj' ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
              🧾 <strong style={{ color: 'var(--text-primary)' }}>Factură persoană juridică:</strong> {order.billing.company}<br />
              CUI: {order.billing.cui}{order.billing.vatPayer ? ' (plătitor TVA)' : ''} · Reg. Com.: {order.billing.regCom}<br />
              {order.billing.address}, {order.billing.city}, {order.billing.county} {order.billing.postalCode}
            </p>
          ) : order.billing ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.3rem' }}>
              🧾 Factură persoană fizică: {order.billing.name}{order.billing.address ? ` — ${order.billing.address}, ${order.billing.city}, ${order.billing.county}` : ' (adresa de livrare)'}
            </p>
          ) : null}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>🚚 {shippingMethod === 'sediu' ? 'Ridicare de la sediu' : shippingMethod === 'easybox' ? 'Easybox SameDay' : 'SameDay Courier'} · 💳 {order.payment_method}</p>
        </div>

        {/* Products */}
        {order.order_items?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produse</p>
            {order.order_items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>{item.product_name} <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span></span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{safe(item.total_price).toFixed(2)} RON</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              <span style={{ color: 'var(--text-primary)' }}>Total</span>
              <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{safe(order.total_amount).toFixed(2)} RON</span>
            </div>
          </div>
        )}

        {/* Status controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <FieldLabel text="Status Comandă" help='Unde se află comanda în procesul de livrare: pending (nouă, neprocesată) → processing (se pregătește) → shipped (a plecat la client) → delivered (livrată). Alege "cancelled" dacă a fost anulată.' />
            <select value={status} onChange={e => setStatus(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: statusColors[status] || 'var(--text-primary)', border: `1px solid ${statusColors[status] || 'var(--border)'}`, borderRadius: 8, fontSize: '0.9rem', width: '100%', fontWeight: 600 }}>
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <FieldLabel text="Status Plată" help='Dacă banii au ajuns sau nu la tine: pending (neplătită încă), paid (plătită), failed (plata a eșuat), refunded (banii au fost returnați clientului).' />
            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', width: '100%' }}>
              {['pending', 'paid', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '-0.6rem', marginBottom: '1rem' }}>
          Modificările de mai sus se salvează abia când apeși „💾 Salvează Modificările" la final.
        </p>

        {/* AWB */}
        {(order as any).awb_number ? (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(72,187,120,0.1)', border: '1px solid var(--success)', borderRadius: 8, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>🏷️ AWB: {(order as any).awb_number}</span>
            <a href={`https://sameday.ro/tracking?awb=${(order as any).awb_number}`} target="_blank" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>Track →</a>
          </div>
        ) : shippingMethod !== 'sediu' ? (
          <>
          <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-input)', border: `1px solid ${locker ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, marginBottom: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {locker ? (
              <p style={{ marginBottom: '0.5rem' }}>📦 <strong style={{ color: 'var(--text-primary)' }}>{locker.name}</strong><br />{locker.address}, {locker.city}, {locker.county} {locker.postalCode}</p>
            ) : (
              <p style={{ marginBottom: '0.5rem' }}>{shippingMethod === 'easybox' ? <>⚠️ <strong style={{ color: 'var(--text-primary)' }}>Comandă pentru easybox</strong> fără punct ales. Alege easybox-ul pe hartă înainte de AWB.</> : 'Livrare la adresă. Poți trimite coletul într-un easybox în loc.'}</p>
            )}
            <button type="button" onClick={() => setMapOpen(true)} className="btn btn-secondary btn-sm">🗺️ {locker ? 'Schimbă easybox-ul pe hartă' : 'Alege easybox pe hartă'}</button>
            {locker && (
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.75rem', cursor: 'pointer' }}
                title="Bifează dacă predai tu coletul personal la un punct SameDay (ex. easybox) în loc să vină curierul la ridicare">
                <input type="checkbox" checked={personalHandover} onChange={e => setPersonalHandover(e.target.checked)} style={{ marginTop: 3 }} />
                <span>Predare personală în orice punct de livrare SameDay — predăm noi coletul la un punct. Debifează dacă vrei să vină curierul să-l ridice.</span>
              </label>
            )}
          </div>
          <button onClick={generateAWB} disabled={awbLoading}
            title="Creează automat eticheta de livrare SameDay pentru această comandă și trece statusul pe 'shipped'"
            style={{ width: '100%', padding: '0.75rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' }}>
            {awbLoading ? '⏳ Se generează...' : '🚚 Generează AWB SameDay'}
          </button>
          </>
        ) : (
          <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 8, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            🏢 Ridicare de la sediu — fără AWB
          </div>
        )}

        {/* Factura Oblio */}
        {invoice?.number ? (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(72,187,120,0.1)', border: '1px solid var(--success)', borderRadius: 8, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>🧾 Factura {invoice.series} {invoice.number}</span>
            {invoice.link && <a href={invoice.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>Deschide →</a>}
          </div>
        ) : (
          <button onClick={generateInvoice} disabled={invoiceLoading}
            title="Emite factura în Oblio cu datele comenzii: client persoană fizică sau juridică, produse și transport"
            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--primary)', borderRadius: 8, fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' }}>
            {invoiceLoading ? '⏳ Se emite factura...' : '🧾 Emite factură în Oblio'}
          </button>
        )}

        {mapOpen && (
          <EasyboxMap open={mapOpen} onClose={() => setMapOpen(false)} onSelect={changeLocker} selectedId={locker?.id} large initialQuery={addr.city || ''}
            title={`📦 Easybox pentru comanda ${order.order_number}`} />
        )}

        {order.notes && (
          <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 8, marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Note:</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{order.notes}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.7rem', background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Închide</button>
          <button onClick={saveChanges} disabled={saving} style={{ flex: 2, padding: '0.7rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {saving ? '⏳...' : '💾 Salvează Modificările'}
          </button>
        </div>
        <button
          onClick={deleteOrder}
          disabled={deleting}
          title="Șterge definitiv această comandă — folosește pentru comenzi de test sau neplătite"
          style={{ width: '100%', marginTop: '0.6rem', padding: '0.55rem', background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
        >
          {deleting ? '⏳ Se șterge...' : '🗑️ Șterge comanda definitiv'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────
export default function AdminPage() {
  const sb = useSupabase()
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  // Nu mai exista formular de login separat pe /admin — daca nu esti deja autentificat
  // ca admin, pagina te trimite la /cont (aceeasi autentificare ca un client normal).
  // Asta inseamna o singura "usa" de logare in tot site-ul, nu doua.
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [tab, setTab] = useState<'products' | 'orders' | 'contact' | 'filtre'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [editProduct, setEditProduct] = useState<any>(null)
  const [editOrder, setEditOrder] = useState<any>(null)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  // Toate atributele (filtrele) existente, extrase din produse — folosite ca sugestii
  // atat la editarea unui produs, cat si in tab-ul Filtre.
  const existingAttrs = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    products.forEach(p => {
      if (!p.attributes) return
      Object.entries(p.attributes as Record<string, string | string[]>).forEach(([k, v]) => {
        if (!map[k]) map[k] = new Set()
        const vals = Array.isArray(v) ? v : [v]
        vals.forEach(val => { if (val) map[k].add(String(val)) })
      })
    })
    const result: Record<string, string[]> = {}
    Object.entries(map).forEach(([k, vs]) => { result[k] = Array.from(vs).sort() })
    return result
  }, [products])

  useEffect(() => {
    if (!sb) return
    sb.auth.getSession().then(({ data }: any) => {
      if (data.session) checkAdminRole(data.session.user)
      else { setCheckingAuth(false); router.replace('/cont') }
    })
  }, [sb])

  // Cât timp e deschis panoul de admin, ascultam in timp real comenzile noi care intra
  // (nu trebuie dat refresh la pagina) — la fiecare comanda noua reincarcam lista, ceea
  // ce actualizeaza automat si cerculetul cu numarul de comenzi neprocesate de pe tab.
  useEffect(() => {
    if (!sb || !authed) return
    const channel = sb
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        loadData()
      })
      .subscribe()
    return () => { sb.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, authed])

  // Comenzile "in asteptare" = inca nevazute/neprocesate de admin — exact cifra care
  // trebuie sa apara in cerculetul de notificare.
  const pendingOrdersCount = useMemo(() => orders.filter((o: any) => o.status === 'pending').length, [orders])

  async function checkAdminRole(user: any) {
    const role = user?.app_metadata?.role || user?.user_metadata?.role
    if (role === 'admin') { setAuthed(true); setCheckingAuth(false); loadData() }
    else {
      // Contul e valid, dar nu e de admin — nu ii aratam un formular de login aici,
      // il trimitem la contul lui normal de client.
      await sb!.auth.signOut()
      setCheckingAuth(false)
      router.replace('/cont')
    }
  }

  async function loadData() {
    if (!sb) return
    setLoading(true)
    const [{ data: prods }, { data: ords }, { data: cats }] = await Promise.all([
      sb.from('products').select('*, categories(name,slug)').order('name'),
      sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      sb.from('categories').select('*').order('name'),
    ])
    setProducts(prods || [])
    setOrders(ords || [])
    setCategories(cats || [])
    setLoading(false)
  }

  async function deleteProduct(id: string) {
    if (!confirm('Sigur vrei să ștergi acest produs?')) return
    await sb!.from('products').delete().eq('id', id)
    loadData()
  }

  async function syncStock() {
    setSyncMsg('⏳ Se sincronizează...')
    const r = await fetch('/api/oblio?action=sync-stock')
    const d = await r.json()
    setSyncMsg(d.success ? `✅ ${d.updated_count} produse actualizate din ${d.total_oblio} în Oblio` : '❌ ' + (d.error || 'Eroare'))
    if (d.success) loadData()
  }

  // Filtered products
  const filteredProducts = products.filter(p => {
    const q = productSearch.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
    const matchFilter = productFilter === 'all' || (productFilter === 'active' && p.is_active) || (productFilter === 'inactive' && !p.is_active) || (productFilter === 'low' && p.stock <= 10 && p.stock > 0) || (productFilter === 'out' && p.stock <= 0)
    return matchSearch && matchFilter
  })

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const q = orderSearch.toLowerCase()
    const matchSearch = !q || o.order_number.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.customer_email.toLowerCase().includes(q)
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter
    return matchSearch && matchStatus
  })

  const statusColors: Record<string, string> = { pending: '#ed8936', processing: '#00d9ff', shipped: '#48bb78', delivered: '#48bb78', cancelled: '#f56565' }

  if (checkingAuth || !authed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
      {checkingAuth ? 'Se verifică autentificarea...' : 'Te redirecționăm către pagina de autentificare...'}
    </div>
  )

  return (
    <div>
      <AdminGuide />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.5rem' }}>Admin Panel</h1>
          {pendingOrdersCount > 0 && (
            <span
              title={`${pendingOrdersCount} comandă${pendingOrdersCount === 1 ? '' : 'nzi'} în așteptare — vezi tab-ul Comenzi`}
              onClick={() => setTab('orders')}
              style={{
                position: 'absolute', top: -8, right: -14,
                minWidth: 20, height: 20, padding: '0 5px',
                borderRadius: 10, background: 'var(--error)', color: '#fff',
                fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', animation: 'tn-pulse 1.6s ease-in-out infinite',
                boxShadow: '0 0 0 2px var(--bg-page, #0a0e27)',
              }}
            >
              {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
            </span>
          )}
          <style>{`@keyframes tn-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a href="/admin-tutorial" target="_blank" className="btn btn-secondary btn-sm" title="Deschide tutorialul complet, pas cu pas, cu exemple">📖 Tutorial Filtre</a>
          <button className="btn btn-secondary btn-sm" onClick={syncStock} title="Actualizează stocurile din contul Oblio pe site, ca să nu vinzi produse epuizate">🔄 Sync Oblio</button>
          <button className="btn btn-secondary btn-sm" title="Verifică dacă legăturile cu SameDay (curier) și Oblio (facturare) funcționează corect" onClick={async () => {
            const [s, o] = await Promise.all([fetch('/api/sameday?action=test'), fetch('/api/oblio?action=test')])
            const [sd, od] = await Promise.all([s.json(), o.json()])
            alert(`SameDay: ${sd.ok ? '✅' : '❌ ' + sd.error}\nOblio: ${od.ok ? '✅' : '❌ ' + od.error}`)
          }}>🔧 Test Integrări</button>
          <button className="btn btn-secondary btn-sm" title="Afișează ID-urile SameDay (servicii, puncte de ridicare) de pus în variabilele Vercel" onClick={async () => {
            const { data: sess } = await sb!.auth.getSession()
            const r = await fetch('/api/sameday', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'diag', accessToken: sess?.session?.access_token || '' }) })
            const d = await r.json()
            if (!d.success) { alert('❌ ' + (d.error || 'Eroare')); return }
            const pp = (d.pickupPoints || []).map((p: any) => `${p.id} — ${p.alias || ''} (${p.address || ''})`).join('\n') || '(niciunul)'
            const sv = (d.services || []).map((s: any) => `${s.id} — ${s.name} (cod: ${s.code})`).join('\n') || '(niciun serviciu returnat)'
            console.log('SameDay puncte de ridicare:', d.pickupPoints, 'servicii:', d.services)
            alert('SERVICII (id — nume):\n' + sv + '\n\nPUNCTE DE RIDICARE (id — nume):\n' + pp)
          }}>🔎 ID-uri SameDay</button>
          <button onClick={() => { sb!.auth.signOut(); setAuthed(false) }}
            title="Ieși din contul de admin"
            style={{ padding: '0.5rem 1rem', background: 'var(--error)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' }}>
            🚪 Ieși
          </button>
        </div>
      </div>

      {syncMsg && <p style={{ marginBottom: '1rem', color: syncMsg.includes('✅') ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>{syncMsg}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        {(['products', 'orders', 'contact', 'filtre'] as const).map(t => {
          const tabTitles: Record<string, string> = {
            products: 'Adaugă, editează sau șterge produsele din magazin',
            orders: 'Vezi și procesează comenzile clienților',
            contact: 'Mesaje trimise de vizitatori prin formularele de pe site',
            filtre: 'Gestionează caracteristicile (Culoare, Material etc.) după care se pot filtra produsele',
          }
          return (
            <button key={t} onClick={() => setTab(t)} title={tabTitles[t]} style={{
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem',
              padding: '0.5rem 1.25rem', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: tab === t ? 'var(--primary)' : 'var(--bg-input)',
              color: tab === t ? '#000' : 'var(--text-secondary)',
            }}>
              {t === 'products' ? `📦 Produse (${products.length})` : t === 'orders' ? `🛒 Comenzi (${orders.length})${pendingOrdersCount > 0 ? ` 🔴 ${pendingOrdersCount} noi` : ''}` : t === 'contact' ? '📩 Cereri' : '🏷️ Filtre'}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : tab === 'products' ? (
        <div>
          {/* Product toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="🔍 Caută după nume sau SKU..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              title="Caută rapid un produs după numele sau codul (SKU) lui"
              style={{ flex: 1, minWidth: 200, padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }}
            />
            <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
              title="Arată doar produsele dintr-o anumită stare (active, inactive, stoc mic sau epuizat)"
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.88rem' }}>
              <option value="all">Toate ({products.length})</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="low">Stoc Scăzut (≤10)</option>
              <option value="out">Stoc Epuizat</option>
            </select>
            <button onClick={() => setEditProduct({})}
              title="Deschide formularul pentru a adăuga un produs nou în magazin"
              style={{ padding: '0.6rem 1rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
              ➕ Produs Nou
            </button>
          </div>

          {/* Products table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Produs</th><th>Categorie</th><th>Preț</th><th>Stoc</th><th>SKU</th><th>Status</th><th>Acțiuni</th></tr></thead>
              <tbody>
                {filteredProducts.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      {p.featured && <span style={{ fontSize: '0.7rem', background: 'rgba(0,217,255,0.15)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>⭐ Recomandat</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.categories?.name || '-'}</td>
                    <td style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      {safe(p.sale_price ?? p.price).toFixed(2)} RON
                      {p.sale_price && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{safe(p.price).toFixed(2)} RON</span>}
                    </td>
                    <td>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, background: p.stock <= 0 ? 'rgba(245,101,101,0.15)' : p.stock <= 10 ? 'rgba(237,137,54,0.15)' : 'rgba(72,187,120,0.15)', color: p.stock <= 0 ? 'var(--error)' : p.stock <= 10 ? 'var(--warning)' : 'var(--success)' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.sku || '-'}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: p.is_active ? 'var(--success)' : 'var(--error)' }}>{p.is_active ? '✓ Activ' : '✗ Inactiv'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => setEditProduct(p)} title="Editează acest produs" style={{ padding: '0.3rem 0.6rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>✏️</button>
                        <button onClick={() => deleteProduct(p.id)} title="Șterge definitiv acest produs (dacă vrei doar să-l ascunzi, editează-l și debifează Activ)" style={{ padding: '0.3rem 0.6rem', background: 'rgba(245,101,101,0.15)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Niciun produs găsit</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'orders' ? (
        <div>
          {/* Orders toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              placeholder="🔍 Caută după nr. comandă, client, email..."
              value={orderSearch}
              onChange={e => setOrderSearch(e.target.value)}
              style={{ flex: 1, minWidth: 220, padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }}
            />
            <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.88rem' }}>
              <option value="all">Toate statusurile</option>
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Orders list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredOrders.map((o: any) => (
              <div key={o.id} className="card" style={{ padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onClick={() => setEditOrder(o)}
                onMouseOver={e => (e.currentTarget as any).style.borderColor = 'var(--primary)'}
                onMouseOut={e => (e.currentTarget as any).style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>{o.order_number}</span>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, background: (statusColors[o.status] || '#718096') + '22', color: statusColors[o.status] || '#718096' }}>{o.status}</span>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: 5, fontSize: '0.75rem', background: o.payment_status === 'paid' ? 'rgba(72,187,120,0.15)' : 'rgba(237,137,54,0.15)', color: o.payment_status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>{o.payment_status}</span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.3rem' }}>{o.customer_name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{o.customer_email} · {o.customer_phone}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>{safe(o.total_amount).toFixed(2)} RON</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(o.created_at).toLocaleDateString('ro-RO')}</p>
                    {(o as any).awb_number && <p style={{ color: 'var(--success)', fontSize: '0.78rem' }}>🏷️ {(o as any).awb_number}</p>}
                  </div>
                </div>
                {o.order_items?.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {o.order_items.map((item: any) => (
                      <span key={item.id} style={{ padding: '0.15rem 0.5rem', background: 'var(--bg-input)', borderRadius: 5, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {item.product_name} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nicio comandă găsită</div>
            )}
          </div>
        </div>
      ) : tab === 'contact' ? (
        <ContactRequests sb={sb!} />
      ) : null}

      {tab === 'filtre' && sb && <FiltrePage sb={sb!} products={products} categories={categories} existingAttrs={existingAttrs} onRefresh={loadData} />}

      {/* Modals */}
      {editProduct !== null && (
        <ProductModal
          product={editProduct?.id ? editProduct : null}
          categories={categories}
          existingAttrs={existingAttrs}
          sb={sb!}
          onSave={() => { setEditProduct(null); loadData() }}
          onClose={() => setEditProduct(null)}
        />
      )}
      {editOrder && (
        <OrderModal
          order={editOrder}
          sb={sb!}
          onClose={() => setEditOrder(null)}
          onUpdate={() => { loadData(); setEditOrder(null) }}
          onDelete={() => { loadData(); setEditOrder(null) }}
        />
      )}
    </div>
  )
}


// ─── Filtre Page ──────────────────────────────────────────────────
function FiltrePage({ sb, products, categories, existingAttrs, onRefresh }: { sb: any, products: any[], categories: any[], existingAttrs: Record<string, string[]>, onRefresh: () => void }) {
  // Stare pentru creare filtru nou
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')
  const [newFilterCategory, setNewFilterCategory] = useState('') // '' = toate categoriile
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // State pentru atribuire filtru la produs
  const [selProduct, setSelProduct] = useState('')
  const [attrKey, setAttrKey] = useState('')
  const [attrVal, setAttrVal] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')

  // Filtrele existente, grupate pe categorie — inclusiv filtrele predefinite pentru
  // o categorie (categories.filter_keys) chiar daca inca niciun produs nu are valori.
  const existingAttrsByCategory = useMemo(() => {
    const result: Record<string, Record<string, string[]>> = {}
    categories.forEach(c => { result[c.id] = {} })
    result['__none__'] = {}
    products.forEach(p => {
      const bucketKey = result[p.category_id] ? p.category_id : '__none__'
      const bucket = result[bucketKey]
      const attrs = (p.attributes as Record<string, string | string[]>) || {}
      Object.entries(attrs).forEach(([k, v]) => {
        if (!bucket[k]) bucket[k] = []
        const vals = Array.isArray(v) ? v : [v]
        vals.forEach(val => { if (val && !bucket[k].includes(String(val))) bucket[k].push(String(val)) })
      })
    })
    categories.forEach(c => {
      (c.filter_keys || []).forEach((k: string) => {
        if (!result[c.id][k]) result[c.id][k] = []
      })
    })
    Object.values(result).forEach(bucket => Object.keys(bucket).forEach(k => bucket[k].sort()))
    return result
  }, [products, categories])

  // Aplica filtru nou la produsele care nu il au (din categoria selectata, sau din tot magazinul daca nu e aleasa niciuna)
  async function createAndApplyFilter() {
    if (!newKey.trim() || !newVal.trim()) { setMsg('⚠️ Completeaza cheia si valoarea!'); return }
    setSaving(true)
    setMsg('')
    const key = newKey.trim()
    const targetProducts = newFilterCategory
      ? products.filter(p => p.category_id === newFilterCategory)
      : products
    let count = 0
    for (const p of targetProducts) {
      const attrs = (p.attributes as Record<string, string[]>) || {}
      if (!attrs[key]) {
        await sb.from('products').update({
          attributes: { ...attrs, [key]: [newVal] }
        }).eq('id', p.id)
        count++
      }
    }
    // Inregistreaza filtrul ca fiind "al" categoriei alese, ca sa apara predefinit
    // (chiar la produse noi, adaugate ulterior, fara sa astepti sa aiba deja valori).
    if (newFilterCategory) {
      const cat = categories.find(c => c.id === newFilterCategory)
      const currentKeys: string[] = cat?.filter_keys || []
      if (cat && !currentKeys.includes(key)) {
        await sb.from('categories').update({ filter_keys: [...currentKeys, key] }).eq('id', newFilterCategory)
      }
    }
    const catName = newFilterCategory ? categories.find(c => c.id === newFilterCategory)?.name : null
    setMsg(`✅ Filtrul "${key}: ${newVal}" a fost adaugat la ${count} produse${catName ? ` din categoria "${catName}"` : ''} care nu il aveau.`)
    setSaving(false)
    onRefresh()
  }

  // Atribuie un filtru specific unui singur produs — ADAUGA valoarea (nu o inlocuieste),
  // ca sa poti pune mai multe valori la acelasi filtru (ex: 2 culori).
  async function assignToProduct() {
    if (!selProduct || !attrKey.trim() || !attrVal.trim()) { setAssignMsg('⚠️ Selecteaza produsul si completeaza filtrul!'); return }
    setAssigning(true)
    setAssignMsg('')
    const p = products.find(x => x.id === selProduct)
    if (!p) { setAssignMsg('Produs negasit'); setAssigning(false); return }
    const key = attrKey.trim()
    const val = attrVal.trim()
    const attrs = { ...(p.attributes as Record<string, string[]> || {}) }
    const current = Array.isArray(attrs[key]) ? attrs[key] : (attrs[key] ? [attrs[key] as any] : [])
    if (current.includes(val)) {
      setAssignMsg(`ℹ️ Produsul "${p.name}" are deja valoarea "${val}" la filtrul "${key}".`)
      setAssigning(false)
      return
    }
    attrs[key] = [...current, val]
    const { error } = await sb.from('products').update({ attributes: attrs }).eq('id', p.id)
    if (error) { setAssignMsg('❌ Eroare: ' + error.message) }
    else { setAssignMsg(`✅ Valoarea "${val}" a fost adaugata la filtrul "${key}" pentru produsul "${p.name}".`) }
    setAssigning(false)
    onRefresh()
  }

  // Sterge un filtru de la toate produsele (si il "dezasociaza" de categoriile care il aveau predefinit)
  async function deleteFilterKey(key: string) {
    if (!confirm(`Stergi filtrul "${key}" de la TOATE produsele?`)) return
    for (const p of products) {
      const attrs = { ...(p.attributes as Record<string, string[]> || {}) }
      if (key in attrs) {
        delete attrs[key]
        await sb.from('products').update({ attributes: attrs }).eq('id', p.id)
      }
    }
    for (const c of categories) {
      if ((c.filter_keys || []).includes(key)) {
        await sb.from('categories').update({ filter_keys: (c.filter_keys || []).filter((k: string) => k !== key) }).eq('id', c.id)
      }
    }
    setMsg(`🗑️ Filtrul "${key}" a fost sters de la toate produsele.`)
    onRefresh()
  }

  // Sterge o valoare specifica a unui filtru (dintr-un array de valori)
  async function deleteFilterValue(key: string, val: string) {
    if (!confirm(`Stergi valoarea "${val}" din filtrul "${key}" de la produsele care o au?`)) return
    let count = 0
    for (const p of products) {
      const attrs = { ...(p.attributes as Record<string, string[]> || {}) }
      const vals = Array.isArray(attrs[key]) ? attrs[key] : (attrs[key] ? [attrs[key] as any] : [])
      if (vals.includes(val)) {
        const remaining = vals.filter((v: string) => v !== val)
        if (remaining.length) attrs[key] = remaining
        else delete attrs[key]
        await sb.from('products').update({ attributes: attrs }).eq('id', p.id)
        count++
      }
    }
    setMsg(`🗑️ Valoarea "${val}" a fost stearsa de la ${count} produse.`)
    onRefresh()
  }

  // Asociaza un filtru existent (definit deja in alta categorie) si acestei categorii
  async function addExistingKeyToCategory(categoryId: string, key: string) {
    if (!key) return
    const cat = categories.find(c => c.id === categoryId)
    const currentKeys: string[] = cat?.filter_keys || []
    if (currentKeys.includes(key)) return
    await sb.from('categories').update({ filter_keys: [...currentKeys, key] }).eq('id', categoryId)
    onRefresh()
  }

  // Dezasociaza un filtru de la o categorie (nu sterge datele produselor, doar nu-l mai "predefineste")
  async function removeKeyFromCategory(categoryId: string, key: string) {
    const cat = categories.find(c => c.id === categoryId)
    const currentKeys: string[] = cat?.filter_keys || []
    await sb.from('categories').update({ filter_keys: currentKeys.filter(k => k !== key) }).eq('id', categoryId)
    onRefresh()
  }

  const inputSty: any = {
    padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', outline: 'none', flex: 1
  }
  const labelSty: any = { fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' as any, letterSpacing: '0.05em' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ background: 'rgba(0,217,255,0.05)' }}>
        <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>
          💡 <strong>Ce sunt filtrele?</strong> Sunt caracteristicile după care clienții pot căuta pe pagina de produse (ex: <em>Culoare</em>, <em>Material</em>, <em>Gramaj</em>). Fiecare filtru are una sau mai multe valori (ex: filtrul <em>Culoare</em> poate avea valorile <em>Alb</em>, <em>Negru</em>, <em>Roșu</em>).
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
          Filtrele nu se creează separat — apar automat pe baza atributelor pe care le pui la fiecare produs (fie de aici, fie din fereastra de editare a produsului). Mai jos ai 3 secțiuni: vezi ce filtre există deja, adaugă un filtru la mai multe produse deodată, sau setează un filtru pentru un singur produs.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: msg.includes('✅') ? 'rgba(72,187,120,0.1)' : msg.includes('⚠️') ? 'rgba(237,137,54,0.1)' : 'rgba(0,217,255,0.1)', border: `1px solid ${msg.includes('✅') ? 'var(--success)' : msg.includes('⚠️') ? 'var(--warning)' : 'var(--border)'}`, borderRadius: 8, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {msg}
        </div>
      )}

      {/* 1. Filtre existente — grupate pe categorie */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center' }}>
          🏷️ Filtre existente pe categorie
          <Help text="Fiecare categorie își are propriile filtre — ex. Filamentele au Culoare/Material/Producător, Componentele au Grup produse. Aici le vezi grupate, poți șterge o valoare/filtru, sau lega un filtru deja existent și de o altă categorie." />
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Filtrele apar sub categoria din care fac parte, ca să nu se mai amestece toate laolaltă.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {categories.map(cat => {
            const bucket = existingAttrsByCategory[cat.id] || {}
            const keys = Object.keys(bucket)
            const allKeysElsewhere = Object.keys(existingAttrs).filter(k => !keys.includes(k))
            return (
              <div key={cat.id}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  {cat.name}
                </p>
                {keys.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Niciun filtru definit pentru această categorie încă.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    {keys.map(key => (
                      <div key={key} style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '0.65rem 0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {key}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400, marginLeft: '0.5rem' }}>({bucket[key].length} valori)</span>
                          </span>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => removeKeyFromCategory(cat.id, key)} title="Elimină acest filtru DIN LISTA categoriei (nu șterge valorile de la produse)" style={{ padding: '0.15rem 0.5rem', background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem' }}>
                              ↩ Scoate din categorie
                            </button>
                            <button onClick={() => deleteFilterKey(key)} title="Elimină acest filtru și toate valorile lui de la toate produsele" style={{ padding: '0.15rem 0.5rem', background: 'rgba(245,101,101,0.1)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                              🗑️ Șterge peste tot
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {bucket[key].length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>— încă nicio valoare la produse —</span>}
                          {bucket[key].map(val => (
                            <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 20, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              {val}
                              <button onClick={() => deleteFilterValue(key, val)} title={`Elimină valoarea "${val}" de la produsele care o au`} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.75rem', padding: 0, lineHeight: 1 }}>✕</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {allKeysElsewhere.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      style={{ ...inputSty, flex: 'none', width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                      value=""
                      onChange={e => { if (e.target.value) addExistingKeyToCategory(cat.id, e.target.value) }}
                    >
                      <option value="">+ leagă un filtru existent de această categorie...</option>
                      {allKeysElsewhere.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
          {Object.keys(existingAttrsByCategory['__none__'] || {}).length > 0 && (
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Fără categorie
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {Object.entries(existingAttrsByCategory['__none__']).map(([key, vals]) => (
                  <div key={key} style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '0.65rem 0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{key} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>({vals.length} valori)</span></span>
                      <button onClick={() => deleteFilterKey(key)} style={{ padding: '0.15rem 0.5rem', background: 'rgba(245,101,101,0.1)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>🗑️ Șterge peste tot</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {vals.map(val => (
                        <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 20, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {val}
                          <button onClick={() => deleteFilterValue(key, val)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.75rem', padding: 0, lineHeight: 1 }}>✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Creeaza filtru nou */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
          ➕ Creeaza filtru nou
          <Help text="Folosește asta când vrei să adaugi un filtru complet nou (ex: un filtru 'Diametru' care încă nu există la niciun produs) la mai multe produse deodată." />
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Adaugă un filtru nou la produsele care nu îl au încă — alege mai jos dacă îl aplici la o singură categorie sau la tot magazinul.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 170 }}>
            <label style={{ ...labelSty, display: 'flex', alignItems: 'center' }}>
              Se aplică la
              <Help text='Alege o categorie ca filtrul să se adauge DOAR la produsele din ea (ex: "Culoare" doar la Filamente). Lasă pe "Toate categoriile" doar dacă filtrul chiar are sens peste tot în magazin.' />
            </label>
            <select style={{ ...inputSty, flex: 'none' }} value={newFilterCategory} onChange={e => setNewFilterCategory(e.target.value)}>
              <option value="">Toate categoriile</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 150 }}>
            <label style={{ ...labelSty, display: 'flex', alignItems: 'center' }}>
              Nume filtru (cheie)
              <Help text='Numele caracteristicii, ex: "Culoare", "Material", "Diametru". Va apărea ca titlu de filtru pe site.' />
            </label>
            <input style={inputSty} value={newKey} onChange={e => setNewKey(e.target.value)} placeholder='ex: Culoare' list="existing-keys" />
            <datalist id="existing-keys">
              {Object.keys(existingAttrs).map(k => <option key={k} value={k} />)}
            </datalist>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 150 }}>
            <label style={{ ...labelSty, display: 'flex', alignItems: 'center' }}>
              Valoare implicita
              <Help text='Valoarea pe care o vor primi produsele vizate (categoria aleasă mai sus, sau toate) care nu au încă acest filtru. Ex: dacă majoritatea sunt "Alb", pune "Alb" aici — apoi corectezi individual excepțiile din secțiunea 3, mai jos.' />
            </label>
            <input style={inputSty} value={newVal} onChange={e => setNewVal(e.target.value)} placeholder='ex: Alb' list="existing-vals" />
            <datalist id="existing-vals">
              {newKey && existingAttrs[newKey]?.map(v => <option key={v} value={v} />)}
            </datalist>
          </div>
          <button onClick={createAndApplyFilter} disabled={saving} style={{ padding: '0.6rem 1.25rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            {saving ? '⏳...' : '✓ Creeaza filtrul'}
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
          * Filtrul se aplică doar în categoria aleasă mai sus (sau în tot magazinul, dacă lași "Toate categoriile"), și doar la produsele care nu au încă această cheie. Produsele care au deja o valoare pentru acest filtru nu sunt modificate.
        </p>
      </div>

      {/* 3. Atribuie filtru la un produs specific */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
          🎯 Atribuie filtru la un produs specific
          <Help text="Folosește asta pentru un singur produs — fie ca să corectezi o excepție (ex: un produs care are altă culoare decât restul), fie ca să adaugi un filtru doar la el." />
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Selecteaza un produs si seteaza sau schimba valoarea unui filtru pentru acel produs.
        </p>

        {assignMsg && (
          <div style={{ padding: '0.6rem 1rem', background: assignMsg.includes('✅') ? 'rgba(72,187,120,0.1)' : 'rgba(245,101,101,0.1)', border: `1px solid ${assignMsg.includes('✅') ? 'var(--success)' : 'var(--error)'}`, borderRadius: 8, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {assignMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ ...labelSty, display: 'flex', alignItems: 'center' }}>
              Produs
              <Help text="Alege produsul căruia vrei să-i setezi un filtru." />
            </label>
            <select style={{ ...inputSty, flex: 'none' }} value={selProduct} onChange={e => setSelProduct(e.target.value)}>
              <option value="">— Selecteaza produsul —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {selProduct && (
            <>
              {/* Show current attributes of selected product */}
              {(() => {
                const p = products.find(x => x.id === selProduct)
                const attrs = (p?.attributes as Record<string,string[]>) || {}
                if (Object.keys(attrs).length > 0) return (
                  <div style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', borderRadius: 8, fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>Filtre curente:</span>
                    {Object.entries(attrs).map(([k,v]) => (
                      <span key={k} style={{ marginRight: '0.5rem', padding: '0.15rem 0.5rem', background: 'var(--bg-hover)', borderRadius: 12, color: 'var(--primary)', fontSize: '0.8rem' }}>{k}: {Array.isArray(v) ? v.join(', ') : v}</span>
                    ))}
                  </div>
                )
                return null
              })()}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 140 }}>
                  <label style={{ ...labelSty, display: 'flex', alignItems: 'center' }}>
                    Filtru (cheie)
                    <Help text='Numele filtrului, ex: "Culoare". Dacă produsul are deja acest filtru, valoarea nouă se ADAUGĂ pe lângă cele existente (nu le înlocuiește) — așa poți pune, de ex., 2 culori la același produs.' />
                  </label>
                  <input style={inputSty} value={attrKey} onChange={e => setAttrKey(e.target.value)} placeholder='ex: Culoare' list="akey-list" />
                  <datalist id="akey-list">
                    {Object.keys(existingAttrs).map(k => <option key={k} value={k} />)}
                  </datalist>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 140 }}>
                  <label style={{ ...labelSty, display: 'flex', alignItems: 'center' }}>
                    Valoare de adăugat
                    <Help text='Valoarea nouă pe care vrei s-o adaugi la acest filtru pentru acest produs, ex: "Violet". Se adaugă pe lângă valorile deja existente — nu le șterge.' />
                  </label>
                  <input style={inputSty} value={attrVal} onChange={e => setAttrVal(e.target.value)} placeholder='ex: Violet' list="aval-list" />
                  <datalist id="aval-list">
                    {attrKey && existingAttrs[attrKey]?.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <button onClick={assignToProduct} disabled={assigning} style={{ padding: '0.6rem 1.25rem', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem' }}>
                    {assigning ? '⏳...' : '✓ Atribuie'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactRequests({ sb }: { sb: any }) {
  const [requests, setRequests] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    sb.from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }: any) => {
        setRequests(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.message?.toLowerCase().includes(q)
    const matchType = typeFilter === 'all' || r.type === typeFilter
    return matchSearch && matchType
  })

  const typeColors: Record<string, string> = {
    'contact':        '#00d9ff',
    'oferta-print3d': '#f59e0b',
    'cerere-retur':   '#f56565',
  }
  const typeLabels: Record<string, string> = {
    'contact':        '📩 Contact',
    'oferta-print3d': '🖨️ Print 3D',
    'cerere-retur':   '↩️ Retur',
  }

  if (loading) return <div className="loading-state"><div className="spinner" /></div>

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Caută după nume, email, mesaj..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.88rem' }}>
          <option value="all">Toate tipurile ({requests.length})</option>
          <option value="contact">📩 Contact</option>
          <option value="oferta-print3d">🖨️ Ofertă Print 3D</option>
          <option value="cerere-retur">↩️ Cerere Retur</option>
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>{filtered.length} cereri</span>
      </div>

      {/* Cards list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nicio cerere găsită</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(r => {
            const isOpen = expanded === r.id
            const color = typeColors[r.type] || 'var(--primary)'
            const label = typeLabels[r.type] || r.type

            return (
              <div key={r.id} className="card" style={{ padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s', borderColor: isOpen ? color : 'var(--border)' }}
                onClick={() => setExpanded(isOpen ? null : r.id)}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <span style={{ padding: '0.15rem 0.6rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 700, background: color + '22', color }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <a href={`mailto:${r.email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{r.email}</a>
                      {r.phone && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>📞 {r.phone}</span>}
                    </div>
                    {/* Preview of message */}
                    {!isOpen && r.message && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{r.message}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(r.created_at).toLocaleDateString('ro-RO')}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(r.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }} onClick={e => e.stopPropagation()}>
                    {r.material && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: 100 }}>Material:</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{r.material}</span>
                      </div>
                    )}
                    {r.message && (
                      <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.3rem' }}>Mesaj / Detalii:</p>
                        <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '0.75rem', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.message}</div>
                      </div>
                    )}
                    {r.file_url && (
                      <a href={r.file_url} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: 'rgba(0,217,255,0.08)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--primary)', fontSize: '0.88rem', textDecoration: 'none', width: 'fit-content' }}>
                        📎 Descarcă fișierul atașat
                      </a>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <a href={`mailto:${r.email}?subject=Re: ${typeLabels[r.type] || ''} - TechNest`}
                        style={{ padding: '0.45rem 0.9rem', background: 'var(--primary)', color: '#000', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-display)' }}>
                        ✉️ Răspunde pe email
                      </a>
                      {r.phone && (
                        <a href={`tel:${r.phone}`}
                          style={{ padding: '0.45rem 0.9rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', textDecoration: 'none' }}>
                          📞 Sună
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
