'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/actions/auth'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error') ?? ''
  const errorText = errorParam ? decodeURIComponent(errorParam) : null

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Create an account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Join the community and start trading ChasmFriend pins.
          </p>
        </div>

        {/* Error banner */}
        {errorText && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800"
          >
            {errorText}
          </div>
        )}

        {/* Registration form */}
        <div className="card">
          <form action={register} className="space-y-5">
            {/* Required fields */}
            <div>
              <label htmlFor="email" className="label">
                Email address <span className="text-red-500">*</span>
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
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="input mt-1"
                placeholder="At least 8 characters"
              />
              <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters.</p>
            </div>

            {/* Optional contact fields */}
            <div className="border-t border-slate-100 pt-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Optional contact info
              </p>
              <p className="mb-4 text-xs text-slate-500">
                These are only shared with users you mutually connect with for trading.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="discord_handle" className="label">
                    Discord username
                  </label>
                  <input
                    id="discord_handle"
                    name="discord_handle"
                    type="text"
                    autoComplete="off"
                    className="input mt-1"
                    placeholder="YourName#1234 or @yourname"
                  />
                </div>

                <div>
                  <label htmlFor="social_handle" className="label">
                    Social media handle
                  </label>
                  <input
                    id="social_handle"
                    name="social_handle"
                    type="text"
                    autoComplete="off"
                    className="input mt-1"
                    placeholder="@yourhandle"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Twitter/X, Instagram, Reddit, etc.
                  </p>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              Create account
            </button>
          </form>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-banner mt-6 text-xs">
          By registering, you acknowledge that all trades are conducted at your own risk.
          This platform takes no responsibility for trades between users.
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/auth/login" prefetch={false} className="font-medium">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
