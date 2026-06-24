import { createClient } from '@supabase/supabase-js'

// Client-side Supabase - always call as function, never at module level
export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Alias for convenience in client components
export const supabaseClient = getSupabase

// Server-side — only inside API route handlers, never at module level
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('Supabase service env vars missing')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
