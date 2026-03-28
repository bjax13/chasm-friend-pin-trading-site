import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * One Supabase client + getUser() per React server request (layout + page share it).
 * Avoids duplicate GoTrue calls that can contribute to rate limits.
 */
export const getCachedAuth = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { supabase, user, error }
})
