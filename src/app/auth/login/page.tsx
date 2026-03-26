'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/actions/auth'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Email confirmation failed — missing code. Please try again.',
  exchange_failed:
    'Email confirmation failed — the link may have expired. Please register again.',
}

const INFO_MESSAGES: Record<string, string> = {
  check_email:
    'Registration successful! Please check your email to confirm your account before logging in.',
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error') ?? ''
  const messageParam = searchParams.get('message') ?? ''
  const next = searchParams.get('next') ?? '/dashboard'

  const errorText = ERROR_MESSAGES[errorParam] ?? (errorParam ? decodeURIComponent(errorParam) : null)
  const infoText = INFO_MESSAGES[messageParam] ?? null

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">
            Log in to manage your ChasmFriend pin trades.
          </p>
        </div>

        {/* Info banner (e.g. post-registration) */}
        {infoText && (
          <div className="mb-6 rounded-lg border border-brand-300 bg-brand-50 p-4 text-sm text-brand-900">
            {infoText}
          </div>
        )}

        {/* Error banner */}
        {errorText && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800"
          >
            {errorText}
          </div>
        )}

        {/* Login form */}
        <div className="card">
          <form action={login} className="space-y-5">
            {/* Hidden next-redirect field */}
            <input type="hidden" name="next" value={next} />

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input mt-1"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input mt-1"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Log in
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-medium">
            Create one for free
          </Link>
        </p>
      </div>
    </main>
  )
}
