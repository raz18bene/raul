import { createClient } from '@supabase/supabase-js'

// Client-side — call inside components/hooks, never at module level
export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Alias — same thing, call as function
export function supabaseClient() {
  return getSupabase()
}

// Server-side — only inside API route handlers
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('Supabase service env vars missing')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
