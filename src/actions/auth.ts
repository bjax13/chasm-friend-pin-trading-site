'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Anon-key server client — used for auth operations that require the session
 *  cookie so Supabase can associate the request with the right user. */
function createAnonClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors thrown from Server Components — the middleware
            // refreshes the session on subsequent requests anyway.
          }
        },
      },
    }
  )
}

/** Service-role client — bypasses RLS; only used to write the initial profile
 *  row right after sign-up (the user has no session yet). */
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // No cookies needed for service-role requests.
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}

// ---------------------------------------------------------------------------
// Auth server actions
// ---------------------------------------------------------------------------

/**
 * Login action.
 * Called from the login form via `<form action={login}>`.
 * Redirects to /dashboard on success or back to /auth/login with an error
 * query-param on failure.
 */
export async function login(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const next = (formData.get('next') as string | null) ?? '/dashboard'

  if (!email || !password) {
    redirect(
      `/auth/login?error=${encodeURIComponent('Email and password are required')}&next=${encodeURIComponent(next)}`
    )
  }

  const supabase = createAnonClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(
      `/auth/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`
    )
  }

  // Only allow relative paths to prevent open-redirect vulnerabilities.
  const safeNext = next.startsWith('/') ? next : '/dashboard'
  redirect(safeNext)
}

/**
 * Register action.
 * Creates a new Supabase Auth user, immediately seeds the `profiles` row
 * (using the service role so it works before email confirmation), then
 * redirects to /auth/login with a "check your email" notice.
 */
export async function register(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const discordHandle =
    (formData.get('discord_handle') as string | null)?.trim() || null
  const socialHandle =
    (formData.get('social_handle') as string | null)?.trim() || null

  if (!email || !password) {
    redirect(
      `/auth/register?error=${encodeURIComponent('Email and password are required')}`
    )
  }

  if (password.length < 8) {
    redirect(
      `/auth/register?error=${encodeURIComponent('Password must be at least 8 characters')}`
    )
  }

  const supabase = createAnonClient()

  // Determine the confirmation-email redirect URL.
  // In production, NEXT_PUBLIC_SITE_URL must be set to the deployed domain.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        discord_handle: discordHandle,
        social_handle: socialHandle,
      },
    },
  })

  if (error) {
    redirect(
      `/auth/register?error=${encodeURIComponent(error.message)}`
    )
  }

  // Seed the profiles row immediately so subsequent subtask agents can
  // upsert into it without worrying about it missing.
  if (data.user) {
    const serviceSupabase = createServiceClient()
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          discord_handle: discordHandle,
          social_handle: socialHandle,
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      // Non-fatal — the profile can be created later from the dashboard.
      console.error('[register] profile upsert error:', profileError.message)
    }
  }

  redirect(
    `/auth/login?message=${encodeURIComponent('check_email')}`
  )
}

/**
 * Logout action.
 * Signs the user out of Supabase and redirects to the homepage.
 */
export async function logout() {
  const supabase = createAnonClient()
  await supabase.auth.signOut()
  redirect('/')
}
