'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import type { Order, OrderItem } from '@/types'

const statusLabels: Record<string, string> = {
  pending: 'În așteptare', processing: 'În procesare', shipped: 'Expediată',
  delivered: 'Livrată', cancelled: 'Anulată',
}
const paymentLabels: Record<string, string> = {
  pending: 'În așteptare', paid: 'Plătită', failed: 'Eșuată', refunded: 'Rambursată',
}

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  city: string | null
  county: string | null
  postal_code: string | null
}

export default function ContPage() {
  const sb = getSupabase()
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)
  const [user, setUser] = useState<any>(null)
  // Daca contul e de admin, nu mai are sens sa vada pagina de client — il trimitem
  // direct in panoul de admin, ca sa nu mai existe un buton separat de "Admin".
  const [redirectingAdmin, setRedirectingAdmin] = useState(false)

  // Login / register form state
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authErr, setAuthErr] = useState('')
  const [authMsg, setAuthMsg] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Orders state
  const [orders, setOrders] = useState<(Order & { order_items: OrderItem[] })[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    sb.auth.getSession().then(({ data }: any) => {
      if (data.session?.user) loadAccount(data.session.user)
      setCheckingSession(false)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_event: string, session: any) => {
      if (session?.user) loadAccount(session.user)
      else { setUser(null); setProfile(null); setOrders([]) }
    })
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAccount(u: any) {
    const role = u?.app_metadata?.role || u?.user_metadata?.role
    if (role === 'admin') {
      setRedirectingAdmin(true)
      router.replace('/admin')
      return
    }
    setUser(u)
    setLoadingOrders(true)
    const [{ data: prof }, { data: ords }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', u.id).maybeSingle(),
      sb.from('orders').select('*, order_items(*)').eq('user_id', u.id).order('created_at', { ascending: false }),
    ])
    setProfile(prof || { id: u.id, full_name: '', phone: '', address: '', city: '', county: '', postal_code: '' })
    setOrders((ords as any) || [])
    setLoadingOrders(false)
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthErr('')
    setAuthMsg('')
    setAuthLoading(true)
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) setAuthErr(error.message === 'Invalid login credentials' ? 'Email sau parolă greșită.' : error.message)
    } else {
      if (password.length < 6) {
        setAuthErr('Parola trebuie să aibă minim 6 caractere.')
        setAuthLoading(false)
        return
      }
      const { error } = await sb.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setAuthErr(error.message === 'User already registered' ? 'Există deja un cont cu acest email — încearcă să te autentifici.' : error.message)
      } else {
        setAuthMsg('Cont creat! Dacă ți se cere, confirmă adresa de email primită, apoi autentifică-te.')
      }
    }
    setAuthLoading(false)
  }

  async function handleLogout() {
    await sb.auth.signOut()
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile) return
    setSavingProfile(true)
    setProfileMsg('')
    const { error } = await sb.from('profiles').upsert({
      id: user.id,
      full_name: profile.full_name,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      county: profile.county,
      postal_code: profile.postal_code,
      updated_at: new Date().toISOString(),
    })
    setSavingProfile(false)
    setProfileMsg(error ? '❌ Eroare la salvare: ' + error.message : '✅ Date salvate.')
  }

  const inputSty: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.9rem', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: '0.95rem',
  }
  const labelSty: React.CSSProperties = { display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }

  if (checkingSession || redirectingAdmin) {
    return <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      {redirectingAdmin ? 'Cont de admin — te redirecționăm în panoul de administrare...' : 'Se încarcă...'}
    </div>
  }

  // ── Neautentificat: login / inregistrare ──
  if (!user) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Contul meu</h1>
          <p className="page-subtitle">Autentifică-te sau creează-ți un cont, ca să nu mai introduci datele de livrare de fiecare dată.</p>
        </div>
        <div className="card" style={{ maxWidth: 440, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => { setMode('login'); setAuthErr(''); setAuthMsg('') }}
              style={{
                flex: 1, padding: '0.6rem', borderRadius: 8, cursor: 'pointer',
                border: '1px solid var(--border)',
                background: mode === 'login' ? 'var(--primary)' : 'transparent',
                color: mode === 'login' ? '#000' : 'var(--text-primary)', fontWeight: 600,
              }}
            >Autentificare</button>
            <button
              onClick={() => { setMode('register'); setAuthErr(''); setAuthMsg('') }}
              style={{
                flex: 1, padding: '0.6rem', borderRadius: 8, cursor: 'pointer',
                border: '1px solid var(--border)',
                background: mode === 'register' ? 'var(--primary)' : 'transparent',
                color: mode === 'register' ? '#000' : 'var(--text-primary)', fontWeight: 600,
              }}
            >Cont nou</button>
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'register' && (
              <div>
                <label style={labelSty}>Nume complet</label>
                <input style={inputSty} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Popescu Ion" />
              </div>
            )}
            <div>
              <label style={labelSty}>Email</label>
              <input style={inputSty} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@exemplu.ro" />
            </div>
            <div>
              <label style={labelSty}>Parolă</label>
              <input style={inputSty} type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Minim 6 caractere" />
            </div>
            {authErr && <p style={{ color: '#f56565', fontSize: '0.9rem' }}>{authErr}</p>}
            {authMsg && <p style={{ color: '#48bb78', fontSize: '0.9rem' }}>{authMsg}</p>}
            <button type="submit" disabled={authLoading} className="btn-primary" style={{ width: '100%', padding: '0.8rem', borderRadius: 8, cursor: 'pointer', opacity: authLoading ? 0.7 : 1 }}>
              {authLoading ? 'Se procesează...' : mode === 'login' ? 'Autentifică-te' : 'Creează cont'}
            </button>
          </form>
        </div>
      </>
    )
  }

  // ── Autentificat: profil + comenzi ──
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Contul meu</h1>
        <p className="page-subtitle">{user.email}</p>
      </div>

      <div className="card" style={{ maxWidth: 600, margin: '0 auto 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.1rem' }}>Date de livrare salvate</h2>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
            Deconectare
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Aceste date se completează automat la checkout data viitoare când comanzi.
        </p>
        <form onSubmit={saveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelSty}>Nume complet</label>
            <input style={inputSty} value={profile?.full_name || ''} onChange={e => setProfile(p => p && { ...p, full_name: e.target.value })} />
          </div>
          <div>
            <label style={labelSty}>Telefon</label>
            <input style={inputSty} value={profile?.phone || ''} onChange={e => setProfile(p => p && { ...p, phone: e.target.value })} />
          </div>
          <div>
            <label style={labelSty}>Cod poștal</label>
            <input style={inputSty} value={profile?.postal_code || ''} onChange={e => setProfile(p => p && { ...p, postal_code: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelSty}>Adresă</label>
            <input style={inputSty} value={profile?.address || ''} onChange={e => setProfile(p => p && { ...p, address: e.target.value })} />
          </div>
          <div>
            <label style={labelSty}>Oraș</label>
            <input style={inputSty} value={profile?.city || ''} onChange={e => setProfile(p => p && { ...p, city: e.target.value })} />
          </div>
          <div>
            <label style={labelSty}>Județ</label>
            <input style={inputSty} value={profile?.county || ''} onChange={e => setProfile(p => p && { ...p, county: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="submit" disabled={savingProfile} className="btn-primary" style={{ padding: '0.7rem 1.5rem', borderRadius: 8, cursor: 'pointer', opacity: savingProfile ? 0.7 : 1 }}>
              {savingProfile ? 'Se salvează...' : 'Salvează datele'}
            </button>
            {profileMsg && <span style={{ fontSize: '0.85rem' }}>{profileMsg}</span>}
          </div>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.1rem', marginBottom: '1rem' }}>Comenzile mele</h2>
        {loadingOrders ? (
          <p style={{ color: 'var(--text-muted)' }}>Se încarcă...</p>
        ) : orders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            Nu ai nicio comandă plasată cât ai fost autentificat. Comenzile plasate fără cont (ca vizitator) nu apar aici.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {orders.map(o => (
              <div key={o.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{o.order_number}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(o.created_at).toLocaleDateString('ro-RO')}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.4rem 0' }}>
                  Status: <strong>{statusLabels[o.status] || o.status}</strong> · Plată: <strong>{paymentLabels[o.payment_status] || o.payment_status}</strong>
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {(o.order_items || []).map(it => `${it.product_name} ×${it.quantity}`).join(', ')}
                </p>
                <p style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '0.4rem' }}>{o.total_amount} RON</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
