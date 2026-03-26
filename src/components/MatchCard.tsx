import type { Match } from '@/lib/types'
import ConnectButton from '@/components/ConnectButton'

interface MatchCardProps {
  match: Match
}

/**
 * Displays a single mutual match — another collector who has at least one pin
 * the current user wants AND wants at least one pin the current user has.
 *
 * Contact information is intentionally withheld here.  It is only revealed
 * on the /connections page once both parties have accepted a connect request.
 */
export default function MatchCard({ match }: MatchCardProps) {
  // Derive a short, anonymous display name from the user_id UUID.
  // e.g. "Collector #A3F2B1"
  const displayName = `Collector #${match.user_id.slice(0, 6).toUpperCase()}`

  const requestId = match.connect_request?.id ?? null
  const status = (match.connect_request?.status as
    | 'pending'
    | 'connected'
    | 'cancelled'
    | null) ?? null

  return (
    <article className="card flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      {/* Left: pin details ------------------------------------------------- */}
      <div className="min-w-0 flex-1 space-y-3">
        <p className="font-semibold text-gray-800">{displayName}</p>

        {/* Pins they have that I want */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            They have · you want
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.they_have_i_want.map((pin) => (
              <span
                key={pin}
                className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
              >
                {pin}
              </span>
            ))}
          </div>
        </div>

        {/* Pins I have that they want */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            You have · they want
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.i_have_they_want.map((pin) => (
              <span
                key={pin}
                className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800"
              >
                {pin}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: connect action --------------------------------------------- */}
      <div className="shrink-0 sm:pl-4">
        <ConnectButton
          recipientId={match.user_id}
          requestId={requestId}
          status={status}
        />
      </div>
    </article>
  )
}
