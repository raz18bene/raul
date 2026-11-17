import { ApiError, object, textField, UUID } from './api-security'

export function money(value: unknown): number {
  if (typeof value !== 'number' && typeof value !== 'string') throw new ApiError(400, 'Sumă invalidă.')
  if (typeof value === 'string' && !/^\d+(\.\d{1,2})?$/.test(value)) throw new ApiError(400, 'Sumă invalidă.')
  const amount = Number(value), cents = Math.round(amount * 100)
  if (!Number.isFinite(amount) || amount < 0 || cents > 99999999 || Math.abs(amount * 100 - cents) > 0.00001) throw new ApiError(400, 'Sumă invalidă.')
  return cents
}
export function cartItems(value: unknown) {
  if (!Array.isArray(value) || !value.length || value.length > 99) throw new ApiError(400, 'Coș invalid.')
  const seen = new Set<string>()
  return value.map(item => {
    const row = object(item)
    if (typeof row.id !== 'string' || !UUID.test(row.id) || seen.has(row.id.toLowerCase())) throw new ApiError(400, 'Produs invalid sau duplicat.')
    if (!Number.isSafeInteger(row.quantity) || row.quantity < 1 || row.quantity > 999) throw new ApiError(400, 'Cantitate invalidă.')
    seen.add(row.id.toLowerCase())
    return { id: row.id.toLowerCase(), quantity: row.quantity as number }
  })
}
export function checkoutInput(raw: Record<string, any>) {
  const items = cartItems(raw.items)
  if (!['card', 'transfer', 'ramburs'].includes(raw.paymentMethod)) throw new ApiError(400, 'Metodă de plată invalidă.')
  if (!['sameday', 'easybox', 'sediu'].includes(raw.shippingMethod)) throw new ApiError(400, 'Metodă de livrare invalidă.')
  const email = textField(raw.customerEmail, 254, true)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Email invalid.')
  const customer: Record<string, any> = {
    customer_name: textField(raw.customerName, 200, true), customer_email: email,
    customer_phone: textField(raw.customerPhone, 50, true), notes: textField(raw.notes, 2000),
    payment_method: raw.paymentMethod, shipping_method: raw.shippingMethod,
  }
  const shippingCost = raw.shippingMethod === 'sediu' ? 0 : 2000
  if (raw.shippingCost != null && money(raw.shippingCost) !== shippingCost) throw new ApiError(409, 'Costul livrării s-a schimbat. Reîncarcă pagina.')
  let ship: Record<string, any>
  if (raw.shippingMethod === 'easybox') {
    const l = object(raw.locker)
    if (!Number.isSafeInteger(l.id) || l.id <= 0) throw new ApiError(400, 'Easybox invalid.')
    const locker = { id: l.id, name: textField(l.name, 200, true), address: textField(l.address, 300, true),
      city: textField(l.city, 100, true), county: textField(l.county, 100, true), postalCode: textField(l.postalCode, 20) }
    ship = { street: locker.address, city: locker.city, county: locker.county, postal_code: locker.postalCode, locker }
  } else {
    const required = raw.shippingMethod !== 'sediu'
    ship = { street: textField(raw.address, 300, required), city: textField(raw.city, 100, required),
      county: textField(raw.county, 100, required), postal_code: textField(raw.postalCode, 20) }
  }
  customer.shipping_address = ship
  const b = raw.billing == null ? {} : object(raw.billing)
  if (b.type === 'pj') {
    const cui = textField(b.cui, 20, true).toUpperCase().replace(/\s/g, '')
    if (!/^(RO)?\d{2,10}$/.test(cui)) throw new ApiError(400, 'CUI invalid.')
    customer.billing = { type: 'pj', company: textField(b.company, 200, true), cui, regCom: textField(b.regCom, 40, true),
      address: textField(b.address, 300, true), city: textField(b.city, 100, true), county: textField(b.county, 100, true),
      postalCode: textField(b.postalCode, 20), vatPayer: b.vatPayer === true }
  } else {
    if (b.type != null && b.type !== 'pf') throw new ApiError(400, 'Tip de facturare invalid.')
    const same = b.sameAsDelivery !== false && raw.shippingMethod !== 'easybox'
    customer.billing = { type: 'pf', name: textField(b.name, 200) || customer.customer_name, sameAsDelivery: same,
      address: same ? ship.street : textField(b.address, 300, true), city: same ? ship.city : textField(b.city, 100, true),
      county: same ? ship.county : textField(b.county, 100, true), postalCode: same ? ship.postal_code : textField(b.postalCode, 20) }
  }
  return { items, customer, expectedTotal: raw.total == null ? null : money(raw.total) }
}
export function storedOrderTotal(order: any) {
  if (!order.order_items?.length || order.order_items.length > 99) throw new ApiError(409, 'Comanda necesită verificare.')
  const shipping = order.shipping_method === 'sediu' ? 0 : ['sameday', 'easybox'].includes(order.shipping_method) ? 2000 : -1
  if (money(order.shipping_cost) !== shipping) throw new ApiError(409, 'Transport inconsistent.')
  const items = order.order_items.reduce((sum: number, item: any) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 999) throw new ApiError(409, 'Cantități inconsistente.')
    const line = money(item.unit_price) * item.quantity
    if (money(item.total_price) !== line) throw new ApiError(409, 'Linie de comandă inconsistentă.')
    return sum + line
  }, 0)
  const total = items + shipping
  if (total <= 0 || total > 99999999 || money(order.total_amount) !== total) throw new ApiError(409, 'Total de comandă inconsistent.')
  return total
}
