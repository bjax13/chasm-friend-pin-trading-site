/**
 * Public Supabase settings (URL + anon key). Safe to import from client components.
 * next.config.mjs maps SUPABASE_URL / SUPABASE_ANON_KEY into NEXT_PUBLIC_* when needed.
 */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
}
