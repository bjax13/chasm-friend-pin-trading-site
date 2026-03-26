import React from 'react'

interface ContactRevealProps {
  /** Display name or email to identify this connection */
  displayName: string
  /** The connected user's email address */
  email: string
  /** Optional Discord handle */
  discordHandle?: string | null
  /** Optional social media handle */
  socialHandle?: string | null
}

/**
 * Displays the revealed contact information for a connected user.
 * This component should only be rendered once a connect_request has
 * status = 'connected' and the server has verified both parties consented.
 */
export default function ContactReveal({
  displayName,
  email,
  discordHandle,
  socialHandle,
}: ContactRevealProps) {
  const hasExtraContact = discordHandle || socialHandle

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white">
          ✓
        </span>
        <span className="text-sm font-semibold text-green-800">
          Contact info for {displayName}
        </span>
      </div>

      <dl className="space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 font-medium text-gray-600">Email</dt>
          <dd>
            <a
              href={`mailto:${email}`}
              className="text-blue-600 underline hover:text-blue-800"
            >
              {email}
            </a>
          </dd>
        </div>

        {discordHandle && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 font-medium text-gray-600">Discord</dt>
            <dd className="text-gray-800">{discordHandle}</dd>
          </div>
        )}

        {socialHandle && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 font-medium text-gray-600">Social</dt>
            <dd className="text-gray-800">{socialHandle}</dd>
          </div>
        )}
      </dl>

      {!hasExtraContact && (
        <p className="mt-2 text-xs text-gray-500">
          This user has not added a Discord or social handle — reach out via
          email.
        </p>
      )}
    </div>
  )
}
