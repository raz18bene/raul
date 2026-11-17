const KEY = 'tn_checkout_info'
const FIELDS = ['name', 'email', 'phone', 'address', 'city', 'county', 'postalCode'] as const
type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
function fields(data: Record<string, unknown>) {
  return Object.fromEntries(FIELDS.filter(k => typeof data[k] === 'string').map(k => [k, data[k] as string]))
}
export function forgetCheckout(storage: StorageAccess) { try { storage.removeItem(KEY) } catch { /* optional convenience */ } }
export function rememberedCheckout(storage: StorageAccess) {
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (saved.consent !== true || !Number.isFinite(saved.expires) || saved.expires <= Date.now() || !saved.data) {
      forgetCheckout(storage); return null
    }
    return fields(saved.data)
  } catch { forgetCheckout(storage); return null }
}
export function rememberCheckout(storage: StorageAccess, data: Record<string, unknown>, consent: boolean) {
  if (!consent) return forgetCheckout(storage)
  try { storage.setItem(KEY, JSON.stringify({ consent: true, expires: Date.now() + 30 * 86400000, data: fields(data) })) }
  catch { /* Optional browser storage must never fail an order. */ }
}
