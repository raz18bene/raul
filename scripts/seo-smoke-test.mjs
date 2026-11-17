import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

// Build AND run against local fixtures. No real database, orders, uploads or email.
const databasePort = 19876
const sitePort = 19877
const site = `http://127.0.0.1:${sitePort}`
const canonicalSite = 'https://www.technestprototyping.ro'
const bot = { 'User-Agent': 'Googlebot' }
const routes = ['/', '/filamente', '/componente', '/accesorii', '/print3d', '/despre-noi', '/contact',
  '/politica-livrare', '/politica-retur', '/politica-confidentialitate', '/politica-gdpr', '/termeni-conditii', '/anpc']
const categories = {
  'componente-electronice': { id: 'category-components', name: 'Componente Electronice' },
  'filamente-3d': { id: 'category-filaments', name: 'Filamente 3D' },
  accesorii: { id: 'category-accessories', name: 'Piese Imprimante 3D' },
}
const products = Array.from({ length: 1005 }, (_, i) => {
  const slug = Object.keys(categories)[i < 3 ? i : 0]
  return {
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    name: `Produs fictiv SEO ${i + 1}`,
    description: i === 0 ? 'Text de test </script><script>neexecutabil</script>' : 'Produs fictiv pentru testele locale.',
    price: 42, sale_price: i === 1 ? 35 : null, stock: i === 2 ? 0 : 5,
    images: [], sku: `SEO-TEST-${i}`, category_id: categories[slug].id,
    is_active: true, featured: false, attributes: {}, categories: { ...categories[slug], slug },
  }
})
const inactive = { ...products[0], id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', name: 'Produs inactiv', is_active: false }
let failCatalog = false
let failContact = false
const savedRequests = []
const pageRequests = []
const database = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${databasePort}`)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)) }
  if (req.method === 'POST' && url.pathname === '/rest/v1/contact_requests') {
    let data = ''; for await (const chunk of req) data += chunk
    if (failContact) return send(503, { code: 'TEST_FAILURE', message: 'Simulated failure' })
    savedRequests.push(JSON.parse(data)); return send(201, null)
  }
  if (req.method !== 'GET') return send(405, {})
  if (url.pathname === '/rest/v1/categories') {
    if (failCatalog) return send(503, { message: 'Simulated failure' })
    const slug = (url.searchParams.get('slug') ?? '').replace(/^eq\./, '')
    return send(200, categories[slug] ? [categories[slug]] : [])
  }
  if (url.pathname === '/rest/v1/products') {
    if (failCatalog) return send(503, { message: 'Simulated failure' })
    const id = url.searchParams.get('id')?.replace(/^eq\./, '')
    const categoryId = url.searchParams.get('category_id')?.replace(/^eq\./, '')
    let data = [...products, inactive]
    if (id) return send(200, data.filter(p => p.id === id))
    assert.equal(url.searchParams.get('is_active'), 'eq.true', 'public listings must filter inactive products')
    assert.equal(url.searchParams.get('order'), 'id.asc', 'pagination must have stable ordering')
    data = data.filter(p => p.is_active && (!categoryId || p.category_id === categoryId))
    const offset = Number(url.searchParams.get('offset') ?? 0)
    pageRequests.push({ categoryId, offset })
    data = data.slice(offset, offset + Math.min(137, Number(url.searchParams.get('limit') ?? 1000)))
    if (url.searchParams.get('select') === 'id') data = data.map(({ id }) => ({ id }))
    return send(200, data)
  }
  return send(404, {})
})

const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_SITE_URL: canonicalSite,
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${databasePort}`, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-public-only',
  SUPABASE_SERVICE_KEY: 'mock-service-local-only', RESEND_API_KEY: '', RESEND_FROM_EMAIL: '',
}
let app
let output = ''
let checks = 0
const pass = message => { checks++; console.log('PASS ' + message) }
const htmlAt = async path => {
  const response = await fetch(site + path, { headers: bot })
  assert.equal(response.status, 200, `${path}: HTTP 200`)
  return response.text()
}
function meta(html, key) {
  return html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1]
}
async function runBuild() {
  // Do not reuse catalog responses from an earlier build or a real environment.
  await rm('.next/cache/fetch-cache', { recursive: true, force: true })
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'build'], { env, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(Error(`Build failed (${code})`)))
  })
}
try {
  await new Promise((resolve, reject) => { database.once('error', reject); database.listen(databasePort, '127.0.0.1', resolve) })
  await runBuild()
  pass('production build with local Supabase fixtures')
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(sitePort), '-H', '127.0.0.1'], {
    env, stdio: ['ignore', 'pipe', 'pipe'],
  })
  app.stdout.on('data', data => { output += data.toString() })
  app.stderr.on('data', data => { output += data.toString() })
  let ready = false
  for (let i = 0; i < 60; i++) {
    if (app.exitCode !== null) throw Error('Next.js exited early: ' + output)
    try { if ((await fetch(site + '/')).ok) { ready = true; break } } catch { /* starting */ }
    await sleep(500)
  }
  assert.ok(ready, 'Next.js did not start: ' + output)

  for (const path of routes) {
    const html = await htmlAt(path)
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(m => m[1])
    assert.equal(canonicals.length, 1, path + ' must have exactly one canonical')
    assert.equal(canonicals[0].replace(/\/$/, ''), canonicalSite + (path === '/' ? '' : path))
    assert.equal(meta(html, 'og:url')?.replace(/\/$/, ''), canonicalSite + (path === '/' ? '' : path))
    assert.ok(meta(html, 'description'))
    assert.ok(meta(html, 'twitter:title'))
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, path + ' must have one H1')
    assert.doesNotMatch(meta(html, 'robots') ?? '', /noindex/)
    assert.match(html, /href="\/politica-retur#retragere"/, path + ' must expose the withdrawal function')
    if (path === '/') {
      assert.match(html, /<title>Printare 3D Timișoara, filamente și Arduino \| TechNest<\/title>/)
      assert.equal(meta(html, 'og:title'), html.match(/<title>(.*?)<\/title>/)?.[1])
    }
    if (path === '/politica-retur') {
      assert.doesNotMatch(html, /name="iban"|name="bank"|<input[^>]+IBAN/i)
      assert.match(html, /id="retragere"/)
    }
    if (path !== '/') {
      assert.equal(meta(html, 'og:title'), html.match(/<title>(.*?)<\/title>/)?.[1])
      const redirect = await fetch(site + path + '/', { redirect: 'manual' })
      assert.equal(redirect.status, 308)
      assert.equal(new URL(redirect.headers.get('location'), site).pathname, path)
    }
    if (path === '/componente') assert.match(html, /<title>Componente electronice și Arduino în Timișoara \| TechNest<\/title>/)
  }
  pass('13 public routes: canonical, social metadata, description, H1 and slash redirects')

  for (const [path, slug] of [['/componente', 'componente-electronice'], ['/filamente', 'filamente-3d'], ['/accesorii', 'accesorii']]) {
    const html = await htmlAt(path)
    const links = new Set([...html.matchAll(/<a\b[^>]*href="\/product\/([^"]+)"/g)].map(m => m[1]))
    for (const p of products.filter(p => p.categories.slug === slug)) assert.ok(links.has(p.id), path + ' missing HTML anchor for ' + p.id)
    assert.ok(!links.has(inactive.id))
  }
  assert.ok(pageRequests.some(p => p.categoryId && p.offset >= 959))
  pass('all 1005 active products linked in server HTML, including category rows beyond 1000')

  for (const p of [...products.slice(0, 3), inactive]) {
    const html = await htmlAt('/product/' + p.id)
    assert.ok(html.includes(`<link rel="canonical" href="${canonicalSite}/product/${p.id}"`))
    assert.ok(html.includes(p.name))
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]))
    const schema = schemas.find(s => s['@type'] === 'Product')
    assert.ok(schema)
    assert.equal(schema.offers.price, (p.sale_price ?? p.price).toFixed(2))
    assert.equal(schema.offers.priceCurrency, 'RON')
    assert.equal(schema.offers.availability, 'https://schema.org/' + (p.stock ? 'InStock' : 'OutOfStock'))
    assert.equal(schema.description, p.description)
    assert.equal(schema.offers.hasMerchantReturnPolicy.merchantReturnDays, 14)
    if (p.stock) assert.equal(schema.offers.shippingDetails.shippingRate.value, 20)
    else assert.equal(schema.offers.shippingDetails, undefined)
    assert.equal(schema.aggregateRating, undefined)
    assert.doesNotMatch(html, /<script>neexecutabil/)
    if (!p.is_active) assert.match(meta(html, 'robots'), /noindex/)
  }
  pass('3 product samples and inactive product: SSR, price, availability, canonical and safe JSON-LD')

  for (const path of ['/product/not-a-uuid', '/product/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '/missing-seo-test']) {
    const response = await fetch(site + path, { headers: bot })
    assert.equal(response.status, 404, path)
    const html = await response.text()
    assert.match(html, /name="robots" content="noindex/)
    assert.doesNotMatch(html, /rel="canonical"/)
  }
  pass('missing products and routes: HTTP 404, noindex and no inherited homepage canonical')

  for (const path of ['/cont', '/checkout', '/payment-return', '/admin', '/admin-tutorial']) {
    const html = await htmlAt(path)
    assert.match(meta(html, 'robots'), /noindex/)
    assert.doesNotMatch(html, /rel="canonical"/)
  }
  pass('5 private/transactional routes retain noindex without homepage canonical')

  for (const [path, method, body] of [
    ['/api/products', 'POST', {}], ['/api/products', 'PUT', {}], ['/api/products', 'DELETE', {}],
    ['/api/oblio', 'POST', { action: 'sync-stock' }], ['/api/oblio', 'POST', { action: 'decrease-stock' }],
    ['/api/oblio?action=test', 'GET'], ['/api/print3d-files?path=private.stl', 'GET'],
    ['/api/withdrawals/confirmations', 'POST', {}],
  ]) {
    const response = await fetch(site + path, { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) })
    assert.equal(response.status, 401, path + ' must require authorization')
  }
  assert.equal((await fetch(site + '/api/netopia/callback', { method: 'POST', body: JSON.stringify({ payment: { status: 5 } }) })).status, 400)
  pass('built API routes reject anonymous administration, private downloads and unsigned payment notifications')

  const xml = await (await fetch(site + '/sitemap.xml')).text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  assert.equal(urls.length, routes.length + products.length)
  assert.equal(new Set(urls).size, urls.length)
  assert.ok(!urls.some(url => url.endsWith(inactive.id)))
  for (const p of products) assert.ok(urls.includes(canonicalSite + '/product/' + p.id))
  assert.doesNotMatch(xml, /<lastmod>|\/cont<|\/admin<|piese-imprimante-3d/)
  assert.ok(pageRequests.some(p => !p.categoryId && p.offset >= 959))
  pass('sitemap: 1018 unique canonical URLs, full pagination, no inactive products or invented lastmod')

  const robots = await (await fetch(site + '/robots.txt')).text()
  assert.match(robots, /Allow: \/contact/)
  assert.match(robots, /Disallow: \/cont(?:\r?\n|$)/)
  assert.match(robots, /Sitemap: https:\/\/www.technestprototyping.ro\/sitemap.xml/)
  pass('robots: explicit contact exception and correct sitemap')

  const alias = await fetch(site + '/piese-imprimante-3d', { redirect: 'manual' })
  assert.equal(alias.status, 308)
  assert.equal(new URL(alias.headers.get('location'), site).pathname, '/accesorii')
  const icon = await fetch(site + '/favicon.ico')
  assert.equal(icon.status, 200)
  assert.match(icon.headers.get('content-type'), /image\/png/)
  assert.ok((await icon.arrayBuffer()).byteLength > 100)
  pass('legacy accessories redirect and working favicon alias')

  const post = body => fetch(site + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const valid = { name: 'Test Local', email: 'test@example.invalid', message: 'Cerere simulată', type: 'contact' }
  assert.equal((await post({})).status, 400)
  assert.equal((await fetch(site + '/api/contact', { method: 'POST', body: '{bad' })).status, 400)
  failContact = true
  const failed = await post(valid)
  assert.equal(failed.status, 503)
  assert.equal((await failed.json()).success, false)
  failContact = false
  const accepted = await post(valid)
  assert.equal(accepted.status, 200)
  assert.equal((await accepted.json()).success, true)
  assert.equal(savedRequests.length, 1)
  assert.equal(savedRequests[0].message, valid.message)
  pass('contact API: invalid JSON/input 400, total failure 503, persisted request 200 without email')

  failCatalog = true
  for (const path of ['/componente', '/product/' + products[0].id]) {
    const response = await fetch(site + path, { headers: bot })
    assert.equal(response.status, 500, path + ' outage must not look like an empty 200 or a missing 404')
  }
  pass('database outage: category/product return 500 instead of empty catalogs or false 404s')
  console.log(`All ${checks} SEO integration groups passed using local fixtures only.`)
} catch (error) {
  console.error(error)
  console.error(output.slice(-5000))
  process.exitCode = 1
} finally {
  app?.kill('SIGTERM')
  if (app && app.exitCode === null) await new Promise(resolve => app.once('exit', resolve))
  if (database.listening) await new Promise(resolve => database.close(resolve))
}
