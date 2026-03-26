'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/actions/inventory'

interface ProfileFormProps {
  initialDiscordHandle: string
  initialSocialHandle: string
}

export default function ProfileForm({
  initialDiscordHandle,
  initialSocialHandle,
}: ProfileFormProps) {
  const [discordHandle, setDiscordHandle] = useState(initialDiscordHandle)
  const [socialHandle, setSocialHandle] = useState(initialSocialHandle)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await updateProfile(discordHandle, socialHandle)

      if ('error' in result) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-brand-200 bg-white p-6 shadow-sm">
      {/* Discord Handle */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="discord_handle"
          className="text-sm font-medium text-gray-700"
        >
          Discord Username
        </label>
        <input
          id="discord_handle"
          name="discord_handle"
          type="text"
          autoComplete="off"
          placeholder="e.g. stormlight_fan"
          value={discordHandle}
          onChange={(e) => setDiscordHandle(e.target.value)}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        />
      </div>

      {/* Social Handle */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="social_handle"
          className="text-sm font-medium text-gray-700"
        >
          Social Media Handle
        </label>
        <input
          id="social_handle"
          name="social_handle"
          type="text"
          autoComplete="off"
          placeholder="e.g. @stormlight_fan (Twitter/X, Instagram, etc.)"
          value={socialHandle}
          onChange={(e) => setSocialHandle(e.target.value)}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        />
      </div>

      {/* Status message */}
      {message && (
        <p
          role="status"
          className={[
            'rounded-lg px-4 py-2 text-sm',
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800',
          ].join(' ')}
        >
          {message.text}
        </p>
      )}

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
