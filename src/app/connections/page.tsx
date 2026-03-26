import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ContactReveal from '@/components/ContactReveal'
import {
  acceptConnectRequest,
  declineConnectRequest,
} from '@/actions/connections'

/** Row returned from the connect_requests table with joined profile data */
interface RequestWithProfile {
  id: string
  status: 'pending' | 'connected' | 'cancelled'
  requester_id: string
  recipient_id: string
  created_at: string
  // joined via requester profile (for incoming requests)
  requester_email: string
  requester_discord: string | null
  requester_social: string | null
  // joined via recipient profile (for connections where I am the requester)
  recipient_email: string
  recipient_discord: string | null
  recipient_social: string | null
}

function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — middleware keeps session refreshed
          }
        },
      },
    }
  )
}

export default async function ConnectionsPage() {
  const supabase = createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/connections')
  }

  // -----------------------------------------------------------------
  // Fetch pending incoming requests (other users who sent ME a request)
  // -----------------------------------------------------------------
  const { data: incomingRaw, error: incomingError } = await supabase
    .from('connect_requests')
    .select(
      `id, status, requester_id, recipient_id, created_at,
       profiles!connect_requests_requester_id_fkey(email, discord_handle, social_handle)`
    )
    .eq('recipient_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (incomingError) {
    console.error('[connections] fetch incoming error:', incomingError.message)
  }

  // -----------------------------------------------------------------
  // Fetch all connected relationships (both directions)
  // -----------------------------------------------------------------
  const { data: connectedRaw, error: connectedError } = await supabase
    .from('connect_requests')
    .select(
      `id, status, requester_id, recipient_id, created_at,
       requester:profiles!connect_requests_requester_id_fkey(email, discord_handle, social_handle),
       recipient:profiles!connect_requests_recipient_id_fkey(email, discord_handle, social_handle)`
    )
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq('status', 'connected')
    .order('created_at', { ascending: false })

  if (connectedError) {
    console.error('[connections] fetch connected error:', connectedError.message)
  }

  // Normalise connected rows: always surface the *other* user's contact info
  const connections = (connectedRaw ?? []).map((row: any) => {
    const amRequester = row.requester_id === user.id
    const other = amRequester ? row.recipient : row.requester
    return {
      id: row.id as string,
      otherEmail: (other?.email ?? '') as string,
      otherDiscord: (other?.discord_handle ?? null) as string | null,
      otherSocial: (other?.social_handle ?? null) as string | null,
      displayName: (other?.email ?? 'Unknown user') as string,
    }
  })

  // Normalise incoming request rows
  const incoming = (incomingRaw ?? []).map((row: any) => {
    const profile = row.profiles ?? {}
    return {
      id: row.id as string,
      requesterId: row.requester_id as string,
      createdAt: row.created_at as string,
      displayName: (profile.email ?? 'Unknown user') as string,
    }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Connections</h1>

      {/* ------------------------------------------------------------------ */}
      {/* Pending incoming requests                                           */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Pending requests
          {incoming.length > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              {incoming.length}
            </span>
          )}
        </h2>

        {incoming.length === 0 ? (
          <p className="text-sm text-gray-500">
            No pending connect requests at the moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {incoming.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{req.displayName}</p>
                  <p className="text-xs text-gray-500">
                    Requested{' '}
                    {new Date(req.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex gap-2">
                  {/* Accept */}
                  <form
                    action={async () => {
                      'use server'
                      await acceptConnectRequest(req.id)
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                    >
                      Accept
                    </button>
                  </form>

                  {/* Decline */}
                  <form
                    action={async () => {
                      'use server'
                      await declineConnectRequest(req.id)
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                    >
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Established connections — contact info revealed                     */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Your connections
        </h2>

        {connections.length === 0 ? (
          <p className="text-sm text-gray-500">
            You have no active connections yet. Head to{' '}
            <a href="/matches" className="text-blue-600 underline">
              Matches
            </a>{' '}
            to send connect requests.
          </p>
        ) : (
          <ul className="space-y-4">
            {connections.map((conn) => (
              <li key={conn.id}>
                <ContactReveal
                  displayName={conn.displayName}
                  email={conn.otherEmail}
                  discordHandle={conn.otherDiscord}
                  socialHandle={conn.otherSocial}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
