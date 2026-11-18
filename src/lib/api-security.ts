import { NextResponse } from 'next/server'
import { createServiceClient } from './supabase'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function object(value: unknown): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Date invalide.')
  return value as Record<string, any>
}
export async function jsonBody(req: Request) {
  try { return object(await req.json()) } catch { throw new ApiError(400, 'Date invalide.') }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message }, { status: error.status })
  console.error('API operation failed')
  return NextResponse.json({ success: false, error: 'Operația nu a putut fi finalizată.' }, { status: 503 })
}
export function bearer(req: Request) { return req.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1] }
export async function verifiedUser(token: unknown) {
  if (typeof token !== 'string' || !token || token.length > 8192) throw new ApiError(401, 'Autentificare necesară.')
  const { data, error } = await createServiceClient().auth.getUser(token)
  if (error || !data.user) throw new ApiError(401, 'Sesiune invalidă.')
  return data.user
}
export async function requireAdmin(req: Request, legacyToken?: unknown) {
  const user = await verifiedUser(bearer(req) ?? legacyToken)
  // user_metadata is editable by the owner and MUST NOT grant privileges.
  if (user.app_metadata?.role !== 'admin') throw new ApiError(403, 'Acces rezervat administratorului.')
  return user
}
export function textField(value: unknown, max: number, required = false): string {
  if (value == null && !required) return ''
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new ApiError(400, 'Câmp obligatoriu sau invalid.')
  return value.trim()
}
