'use client'

import { useState, useTransition } from 'react'
import { sendConnectRequest, cancelConnectRequest } from '@/actions/connections'

interface ConnectButtonProps {
  /** The user_id of the person to connect with. */
  recipientId: string
  /**
   * The id of the existing connect_request between the current user and this
   * recipient, or null if no request exists yet.
   */
  requestId: string | null
  /**
   * Current status of the existing request.
   * - null      → no request has been sent yet (or it was cancelled)
   * - 'pending' → current user already sent a request; can cancel it
   */
  status: 'pending' | 'connected' | 'cancelled' | null
}

/**
 * Client component that lets the current user send or cancel a connect
 * request to a matched collector.
 *
 * - No request / cancelled → shows a "Connect" button (AC #5)
 * - Pending request        → shows "Request sent" badge + "Cancel" link (AC #10)
 *
 * The 'connected' status is handled by the parent page (connected matches are
 * filtered out and shown on /connections instead), but we guard it here too.
 */
export default function ConnectButton({
  recipientId,
  requestId,
  status,
}: ConnectButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // ── Send connect request ──────────────────────────────────────────────────
  function handleSend() {
    setError(null)
    startTransition(async () => {
      const result = await sendConnectRequest(recipientId)
      if (result.error) setError(result.error)
    })
  }

  // ── Cancel pending request ────────────────────────────────────────────────
  function handleCancel() {
    if (!requestId) return
    setError(null)
    startTransition(async () => {
      const result = await cancelConnectRequest(requestId)
      if (result.error) setError(result.error)
    })
  }

  // ── Already connected — shouldn't normally be rendered on /matches ────────
  if (status === 'connected') {
    return (
      <a
        href="/connections"
        className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 underline-offset-2 hover:underline"
      >
        Connected ↗
      </a>
    )
  }

  // ── Pending: show badge + cancel ──────────────────────────────────────────
  if (status === 'pending' && requestId) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-800">
          Request sent
        </span>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="text-xs text-gray-500 underline underline-offset-2 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Cancel this connect request"
        >
          {isPending ? 'Cancelling…' : 'Cancel request'}
        </button>
        {error && (
          <p role="alert" className="max-w-[16rem] text-right text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  }

  // ── Default: no active request → show Connect button ─────────────────────
  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleSend}
        disabled={isPending}
        className="btn-primary"
        aria-label="Send a connect request to this collector"
      >
        {isPending ? 'Sending…' : 'Connect'}
      </button>
      {error && (
        <p role="alert" className="max-w-[16rem] text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
