import { ApiError } from './api-security'
// A single document type owns stock deduction. Do not switch without reconciling open orders.
export function stockDocument(): 'invoice' | 'notice' {
  const mode = process.env.OBLIO_STOCK_DOCUMENT || 'invoice'
  if (mode !== 'invoice' && mode !== 'notice') throw new ApiError(503, 'Configurarea gestiunii Oblio necesită verificare.')
  return mode
}
export function oblioClient(order: any) {
  const b = order.billing || {}, ship = order.shipping_address || {}
  return b.type === 'pj'
    ? { cif: b.cui, name: b.company, rc: b.regCom, address: b.address, state: b.county, city: b.city, country: 'Romania',
        email: order.customer_email, phone: order.customer_phone, vatPayer: !!b.vatPayer || /^RO/i.test(String(b.cui || '')) }
    : { name: b.name || order.customer_name,
        address: (b.sameAsDelivery === false ? b.address : ship.street) || ship.street || '',
        state: (b.sameAsDelivery === false ? b.county : ship.county) || ship.county || '',
        city: (b.sameAsDelivery === false ? b.city : ship.city) || ship.city || '',
        country: 'Romania', email: order.customer_email, phone: order.customer_phone, vatPayer: false }
}
