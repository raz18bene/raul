import { createHmac, timingSafeEqual } from 'node:crypto'
import { ApiError } from './api-security'
export const PRINT_BUCKET = 'print3d-requests'
export const MAX_PRINT_FILE = 50 * 1024 * 1024
export function validPrintPath(path: unknown): path is string {
  return typeof path === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-zA-Z0-9._-]{1,180}\.(stl|obj|step|stp|3mf|f3d|gcode|pdf)$/i.test(path)
}
function signature(path: string, expires: number) {
  const secret = process.env.PRINT3D_UPLOAD_SECRET
  if (!secret || secret.length < 32) throw new ApiError(503, 'Încărcarea fișierelor nu este configurată.')
  return createHmac('sha256', secret).update(`${path}\n${expires}`).digest('hex')
}
export function attachmentProof(path: string, expires: number) { return `${expires}.${signature(path, expires)}` }
export function verifyAttachment(path: unknown, proof: unknown) {
  if (!validPrintPath(path) || typeof proof !== 'string' || !/^\d+\.[a-f0-9]{64}$/.test(proof)) throw new ApiError(400, 'Atașament invalid.')
  const [time, hash] = proof.split('.'), expires = Number(time)
  if (!Number.isSafeInteger(expires) || expires < Date.now() || expires > Date.now() + 25 * 3600000
    || !timingSafeEqual(Buffer.from(signature(path, expires), 'hex'), Buffer.from(hash, 'hex'))) throw new ApiError(400, 'Atașamentul a expirat sau este invalid.')
  return path
}
