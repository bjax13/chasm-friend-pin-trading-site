import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase Auth PKCE callback handler.
 *
 * Supabase redirects here after a user clicks the confirmation link in their
 * email. The URL contains a `code` query parameter which must be exchanged for
 * a session via PKCE. Once the session is established the user is redirected
 * to `/dashboard` (or to the `next` param if one was passed through the flow).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    // No code present — something went wrong upstream
    return NextResponse.redirect(
      `${origin}/auth/login?error=missing_code`
    )
  }

  const cookieStore = cookies()

  const supabase = createServerClient(
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
            // Called from a Server Component — safe to ignore because the
            // middleware will keep the session refreshed on subsequent requests.
          }
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      `${origin}/auth/login?error=exchange_failed`
    )
  }

  // Successful exchange — send the user to their intended destination.
  // Only allow relative paths to prevent open-redirect vulnerabilities.
  const safeNext = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${safeNext}`)
}
