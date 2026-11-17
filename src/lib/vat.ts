import { ApiError } from './api-security'
export function standardVat() {
  if (process.env.OBLIO_VAT_PERCENTAGE && process.env.OBLIO_VAT_PERCENTAGE !== '21') throw new ApiError(503, 'Cota TVA Oblio necesită actualizare la 21%.')
  return { vatName: process.env.OBLIO_VAT_NAME || 'Normala', vatPercentage: 21, vatIncluded: true }
}
