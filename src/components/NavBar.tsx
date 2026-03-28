/**
 * NavBar — top navigation bar.
 *
 * Server Component: reads the current user's session from Supabase on every
 * render so the displayed links always reflect real auth state without any
 * client-side hydration flash.
 *
 * Authenticated:   Logo | Matches | Connections | Dashboard | Log out
 * Unauthenticated: Logo | Log in  | Register
 */

import Link from 'next/link'
import { getCachedAuth } from '@/lib/supabase/session'
import { logout } from '@/actions/auth'

// ---------------------------------------------------------------------------
// Inline server action wrapper — form actions must accept FormData even when
// the underlying action does not need it.
// ---------------------------------------------------------------------------
async function handleLogout(_formData: FormData) {
  'use server'
  await logout()
}

export default async function NavBar() {
  const { user } = await getCachedAuth()

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-brand-700 no-underline hover:text-brand-800"
        >
          {/* Small pin icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 text-brand-500"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.876 15.992 15.992 0 0 0 2.683-3.115C17.8 16.147 18.75 13.845 18.75 11.25a6.75 6.75 0 0 0-13.5 0c0 2.596.95 4.897 2.454 7.11a15.989 15.989 0 0 0 2.683 3.115 16.974 16.974 0 0 0 1.143.876ZM12 13.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
              clipRule="evenodd"
            />
          </svg>
          ChasmFriend Pins
        </Link>

        {/* Navigation links */}
        <ul className="flex items-center gap-1 text-sm font-medium" role="list">
          {user ? (
            <>
              <li>
                <Link
                  href="/matches"
                  prefetch={false}
                  className="rounded-md px-3 py-2 text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Matches
                </Link>
              </li>
              <li>
                <Link
                  href="/connections"
                  prefetch={false}
                  className="rounded-md px-3 py-2 text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Connections
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  prefetch={false}
                  className="rounded-md px-3 py-2 text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <form action={handleLogout}>
                  <button
                    type="submit"
                    className="rounded-md px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Log out
                  </button>
                </form>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  href="/auth/login"
                  prefetch={false}
                  className="rounded-md px-3 py-2 text-slate-600 no-underline transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  prefetch={false}
                  className="btn-primary no-underline"
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}
