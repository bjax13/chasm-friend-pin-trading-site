/**
 * Service role key for server-only Supabase clients. Prefer SUPABASE_SERVICE_ROLE_KEY;
 * SUPABASE_TOKEN is supported as an alias (e.g. dashboard "secret" / sb_secret_ keys).
 */
export function getSupabaseServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_TOKEN ||
    ''
  )
}
