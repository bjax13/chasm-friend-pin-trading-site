import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types'

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and
 * Route Handlers. Reads/writes the auth session cookie so the user's session
 * is automatically refreshed on every request.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll is called from a Server Component where cookies cannot be
            // mutated. Safe to ignore — the middleware will keep the session fresh.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase admin client using the service role key.
 * MUST only be used in server-side code (Server Actions, Route Handlers).
 * Bypasses RLS — use only for operations that legitimately require it
 * (e.g., reading another user's contact info after mutual connection).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
