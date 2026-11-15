import test from 'node:test'
import assert from 'node:assert/strict'
import { readAllPages } from '../src/lib/catalog-pagination'
import { categoryPath, offerPolicies, serializeJsonLd } from '../src/lib/seo'

test('catalog reads every page even if Supabase caps rows below the requested size', async () => {
  const source = Array.from({ length: 1007 }, (_, id) => ({ id }))
  const result = await readAllPages(async from => ({ data: source.slice(from, from + 137), error: null }))
  assert.deepEqual(result, source)
})

test('catalog fails the whole request instead of exposing a partial sitemap', async () => {
  await assert.rejects(readAllPages(async from => from === 0
    ? { data: [{ id: 'first' }], error: null }
    : { data: null, error: { message: 'simulated database failure' } }), /Catalog query failed/)
})

test('breadcrumbs resolve old accessory slugs to the canonical category', () => {
  assert.equal(categoryPath('piese-imprimante-3d'), '/accesorii')
  assert.equal(categoryPath('unpublished-category'), undefined)
})

test('JSON-LD safely round-trips catalog text including a closing script tag', () => {
  const value = { description: '</script><script>test</script>' }
  const text = serializeJsonLd(value)
  assert.doesNotMatch(text, /<script|<\/script/)
  assert.deepEqual(JSON.parse(text), value)
})

test('commercial markup follows published policies, excluding custom goods and unknown restock dates', () => {
  const policy = offerPolicies('filamente-3d', true)
  assert.equal(policy.shippingDetails?.shippingRate.value, 20)
  assert.equal(policy.hasMerchantReturnPolicy?.merchantReturnDays, 14)
  assert.match(policy.hasMerchantReturnPolicy!.returnFees, /ReturnFeesCustomerResponsibility$/)
  assert.equal(offerPolicies('filamente-3d', false).shippingDetails, undefined)
  assert.equal(offerPolicies('print-3d', true).hasMerchantReturnPolicy, undefined)
  assert.doesNotMatch(JSON.stringify(policy), /aggregateRating|review|handlingTime/)
})
