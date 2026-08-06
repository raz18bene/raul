// Script de verificare: cateogorii + numar de produse (active/inactive) pentru fiecare
// Ruleaza din radacina proiectului cu: node scripts/check-categories.mjs
// Citeste automat NEXT_PUBLIC_SUPABASE_URL si NEXT_PUBLIC_SUPABASE_ANON_KEY din .env.local

import { readFileSync } from 'fs'

function loadEnvLocal() {
  const env = {}
  try {
    const content = readFileSync('.env.local', 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
      env[key] = val
    }
  } catch {
    console.error('Nu am gasit .env.local in directorul curent. Ruleaza scriptul din radacina proiectului.')
    process.exit(1)
  }
  return env
}

const env = loadEnvLocal()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Lipsesc NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY din .env.local')
  process.exit(1)
}

async function sb(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  })
  if (!res.ok) {
    console.error(`Eroare la ${path}: ${res.status} ${res.statusText}`)
    console.error(await res.text())
    process.exit(1)
  }
  return res.json()
}

async function main() {
  console.log('Se conecteaza la:', SUPABASE_URL)
  console.log('---')

  const categories = await sb('categories?select=id,name,slug&order=name')
  console.log(`Categorii gasite: ${categories.length}\n`)

  for (const cat of categories) {
    const active = await sb(`products?select=id&category_id=eq.${cat.id}&is_active=eq.true`)
    const inactive = await sb(`products?select=id&category_id=eq.${cat.id}&is_active=eq.false`)
    console.log(
      `- "${cat.name}"  slug="${cat.slug}"  id=${cat.id}\n` +
      `    produse active: ${active.length} | inactive: ${inactive.length}`
    )
  }

  // Sanity check: sloturile pe care le foloseste site-ul in cod
  const expectedSlugs = ['filamente-3d', 'componente-electronice', 'accesorii']
  console.log('\n--- Verificare slug-uri asteptate de site ---')
  for (const slug of expectedSlugs) {
    const found = categories.find(c => c.slug === slug)
    console.log(found ? `OK   "${slug}" -> exista (id=${found.id})` : `LIPSA "${slug}" -> NU exista in categories!`)
  }
}

main()
