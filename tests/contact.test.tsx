import test from 'node:test'
import assert from 'node:assert/strict'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import ContactPage from '../src/app/contact/page'
import PrintPage from '../src/app/print3d/page'

test('a private attachment requires a saved admin reference, even if its email succeeds', async () => {
  const body = parseContact({ name: 'Test', email: 'test@example.invalid', message: 'Model', type: 'oferta-print3d' })!
  body.fileUrl = 'private:11111111-1111-4111-8111-111111111111/model.stl'
  assert.equal(await deliverContact(body, { save: async () => false, email: async () => true }), false)
  assert.equal(await deliverContact(body, { save: async () => true, email: async () => false }), true)
})
import { parseContact, deliverContact, contactEmail, submitContact } from '../src/lib/contact'

const input = { name: 'Test <b>Local</b>', email: 'test@example.invalid', message: '<script>test</script>', type: 'contact' }
const body = parseContact(input)!

test('contact accepts valid form data and rejects invalid payloads before delivery', () => {
  assert.ok(body)
  for (const value of [null, [], {}, { ...input, email: 'bad' }, { ...input, name: 123 },
    { ...input, message: ' ' }, { ...input, message: 'x'.repeat(10001) }, { ...input, type: 'arbitrary' },
    { ...input, type: 'oferta-print3d', fileUrl: 'javascript:alert(1)' }]) assert.equal(parseContact(value), null)
  assert.ok(parseContact({ ...input, type: 'oferta-print3d', fileUrl: 'https://example.invalid/model.stl' }))
  assert.ok(parseContact({ ...input, type: 'cerere-retur' }))
})

test('success requires at least one confirmed delivery channel', async () => {
  for (const [saved, emailed, expected] of [[false, false, false], [true, false, true], [false, true, true], [true, true, true]]) {
    assert.equal(await deliverContact(body, { save: async () => saved, email: async () => emailed }), expected)
  }
  assert.equal(await deliverContact(body, { save: async () => { throw Error('database') }, email: async () => { throw Error('email') } }), false)
  assert.equal(await deliverContact(body, { save: async () => true, email: async () => { throw Error('email') } }), true)
})

test('email preserves return details, escapes visitor content and uses the canonical site', () => {
  const mail = contactEmail({ ...body, type: 'cerere-retur', message: 'Comanda TEST123\nIBAN TEST-ONLY\n<script>bad</script>' }, 'https://www.technestprototyping.ro')
  assert.match(mail.html, /TEST123/)
  assert.match(mail.html, /TEST-ONLY/)
  assert.match(mail.html, /&lt;script&gt;/)
  assert.doesNotMatch(mail.html, /<script>|raul-opal/)
})

test('client rejects HTTP errors, malformed replies, explicit failure and network failure', async () => {
  for (const response of [new Response('{"success":true}', { status: 503 }), new Response('{"success":false}'), new Response('invalid')]) {
    await assert.rejects(submitContact(input, (async () => response) as typeof fetch), /Cererea nu a putut/)
  }
  await assert.rejects(submitContact(input, (async () => { throw Error('offline') }) as typeof fetch), /Cererea nu a putut/)
  await submitContact(input, (async () => new Response('{"success":true}')) as typeof fetch)
})

for (const [name, Page] of [['contact', ContactPage], ['print3d', PrintPage]] as const) {
  test(`${name}: failed submission preserves inputs, prevents double submission and permits retry`, async () => {
    const original = globalThis.fetch
    let renderer: ReactTestRenderer | undefined
    let calls = 0
    let finish!: (value: Response) => void
    globalThis.fetch = (async () => { calls++; return new Promise<Response>(resolve => { finish = resolve }) }) as typeof fetch
    try {
      await act(async () => { renderer = create(<Page />) })
      const root = renderer!.root
      await act(async () => root.findAllByType('input')[0].props.onChange({ target: { value: 'Date păstrate' } }))
      let first!: Promise<void>
      await act(async () => {
        first = root.findByType('form').props.onSubmit({ preventDefault() {} })
        await Promise.resolve()
        await root.findByType('form').props.onSubmit({ preventDefault() {} })
      })
      assert.equal(calls, 1)
      assert.equal(root.findAllByType('button').find(b => b.props.type === 'submit')!.props.disabled, true)
      await act(async () => { finish(new Response('{"success":false}', { status: 503 })); await first })
      assert.equal(root.findAllByType('input')[0].props.value, 'Date păstrate')
      assert.match(root.findByProps({ role: 'alert' }).children.join(''), /Cererea nu a putut/)
      assert.equal(root.findAllByType('button').find(b => b.props.type === 'submit')!.props.disabled, false)
      globalThis.fetch = (async () => new Response('{"success":true}')) as typeof fetch
      await act(async () => { await root.findByType('form').props.onSubmit({ preventDefault() {} }) })
      assert.equal(root.findAllByType('form').length, 0)
      assert.match(JSON.stringify(renderer!.toJSON()), /înregistrat/)
    } finally {
      await act(async () => renderer?.unmount())
      globalThis.fetch = original
    }
  })
}

test('print3d: an oversized attachment never submits a request or shows success', async () => {
  const original = globalThis.fetch
  let renderer: ReactTestRenderer | undefined
  let calls = 0
  globalThis.fetch = (async () => { calls++; throw new Error('unexpected request') }) as typeof fetch
  try {
    await act(async () => { renderer = create(<PrintPage />) })
    await act(async () => renderer!.root.findByProps({ id: 'file-upload' }).props.onChange({ target: { files: [{ size: 51 * 1024 * 1024, name: 'test.stl' }] } }))
    await act(async () => { await renderer!.root.findByType('form').props.onSubmit({ preventDefault() {} }) })
    assert.equal(calls, 0)
    assert.match(renderer!.root.findByProps({ role: 'alert' }).children.join(''), /50 MB/)
    assert.equal(renderer!.root.findAllByType('form').length, 1)
  } finally { await act(async () => renderer?.unmount()); globalThis.fetch = original }
})

test('print3d: a failed attachment upload does not silently send an incomplete request', async () => {
  const original = globalThis.fetch
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:19876'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-only'
  let renderer: ReactTestRenderer | undefined
  let contactCalls = 0
  globalThis.fetch = (async (url) => {
    if (url === '/api/contact') contactCalls++
    throw Error('simulated upload failure')
  }) as typeof fetch
  try {
    await act(async () => { renderer = create(<PrintPage />) })
    await act(async () => renderer!.root.findByProps({ id: 'file-upload' }).props.onChange({ target: { files: [new File(['test'], 'test.stl')] } }))
    await act(async () => { await renderer!.root.findByType('form').props.onSubmit({ preventDefault() {} }) })
    assert.equal(contactCalls, 0)
    assert.match(renderer!.root.findByProps({ role: 'alert' }).children.join(''), /nu a putut fi încărcat/)
    assert.equal(renderer!.root.findAllByType('form').length, 1)
  } finally {
    await act(async () => renderer?.unmount()); globalThis.fetch = original
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
  }
})
