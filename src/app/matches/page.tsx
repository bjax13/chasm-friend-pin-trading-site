import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { getCachedAuth } from '@/lib/supabase/session'
import MatchCard from '@/components/MatchCard'
import type { Match, ConnectRequest, PinName } from '@/lib/types'
import { PIN_NAMES } from '@/lib/pins'

// ---------------------------------------------------------------------------
// Matching logic
// ---------------------------------------------------------------------------

/**
 * Returns the list of mutual matches for the given user.
 *
 * A mutual match is another user where:
 *   - they have at least one pin the current user wants, AND
 *   - they want at least one pin the current user has.
 *
 * Contact information is NOT included here — it is only revealed on the
 * /connections page once both users have accepted a connect request.
 */
async function getMatches(
  userId: string,
  anon: SupabaseClient
): Promise<Match[]> {
  // The admin client bypasses RLS — used only to read other users' pin_inventory.
  // Contact info is NEVER read via this client on this page.
  const admin = createAdminClient()

  // ── Step 1: load the current user's pin inventory ─────────────────────────
  const { data: myInventoryRows, error: myInvErr } = await anon
    .from('pin_inventory')
    .select('pin_name, has_it, wants_it')
    .eq('user_id', userId)

  if (myInvErr) {
    console.error('[matches] load own inventory error:', myInvErr.message)
    return []
  }

  const pinSet = new Set(PIN_NAMES as readonly string[])

  const myHasPins: PinName[] = (myInventoryRows ?? [])
    .filter((r) => r.has_it && pinSet.has(r.pin_name))
    .map((r) => r.pin_name as PinName)

  const myWantPins: PinName[] = (myInventoryRows ?? [])
    .filter((r) => r.wants_it && pinSet.has(r.pin_name))
    .map((r) => r.pin_name as PinName)

  // No possible matches if the user hasn't set any has_it or wants_it pins.
  if (myHasPins.length === 0 || myWantPins.length === 0) return []

  // ── Step 2: find users who HAVE a pin I WANT ──────────────────────────────
  // Uses the admin client because pin_inventory RLS only allows users to see
  // their own rows. We read ONLY user_id — no contact info.
  const { data: theyHaveRows, error: theyHaveErr } = await admin
    .from('pin_inventory')
    .select('user_id')
    .in('pin_name', myWantPins)
    .eq('has_it', true)
    .neq('user_id', userId)

  if (theyHaveErr) {
    console.error('[matches] they-have query error:', theyHaveErr.message)
    return []
  }

  const candidateIds = Array.from(
    new Set(
      (theyHaveRows ?? []).map((r: { user_id: string }) => r.user_id)
    )
  )
  if (candidateIds.length === 0) return []

  // ── Step 3: among those candidates, find who WANTS a pin I HAVE ──────────
  const { data: theyWantRows, error: theyWantErr } = await admin
    .from('pin_inventory')
    .select('user_id')
    .in('pin_name', myHasPins)
    .eq('wants_it', true)
    .in('user_id', candidateIds)

  if (theyWantErr) {
    console.error('[matches] they-want query error:', theyWantErr.message)
    return []
  }

  const matchedIds = Array.from(
    new Set(
      (theyWantRows ?? []).map((r: { user_id: string }) => r.user_id)
    )
  )
  if (matchedIds.length === 0) return []

  // ── Step 4: load existing connect requests involving the current user ─────
  // The session client is used — RLS ensures we only see requests we're in.
  const { data: requestRows, error: requestErr } = await anon
    .from('connect_requests')
    .select('id, requester_id, recipient_id, status, created_at, updated_at')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .neq('status', 'cancelled')

  if (requestErr) {
    console.error('[matches] connect_requests query error:', requestErr.message)
  }

  // Build a map from other-user-id → ConnectRequest for O(1) lookup.
  const requestMap = new Map<string, ConnectRequest>()
  ;(requestRows ?? []).forEach((row) => {
    const otherId =
      row.requester_id === userId ? row.recipient_id : row.requester_id
    requestMap.set(otherId, row as ConnectRequest)
  })

  // ── Step 5: load full pin inventory for all matched users ─────────────────
  const { data: matchInventoryRows, error: matchInvErr } = await admin
    .from('pin_inventory')
    .select('user_id, pin_name, has_it, wants_it')
    .in('user_id', matchedIds)

  if (matchInvErr) {
    console.error('[matches] match inventory query error:', matchInvErr.message)
    return []
  }

  // ── Step 6: assemble Match objects ────────────────────────────────────────
  const matches: Match[] = matchedIds
    .map((matchedUserId) => {
      const theirInventory = (matchInventoryRows ?? []).filter(
        (r: { user_id: string }) => r.user_id === matchedUserId
      )

      const theyHaveIWant: PinName[] = theirInventory
        .filter(
          (r: { pin_name: string; has_it: boolean }) =>
            r.has_it && (myWantPins as string[]).includes(r.pin_name)
        )
        .map((r: { pin_name: string }) => r.pin_name as PinName)

      const iHaveTheyWant: PinName[] = theirInventory
        .filter(
          (r: { pin_name: string; wants_it: boolean }) =>
            r.wants_it && (myHasPins as string[]).includes(r.pin_name)
        )
        .map((r: { pin_name: string }) => r.pin_name as PinName)

      // Safety check: only include bilateral matches.
      if (theyHaveIWant.length === 0 || iHaveTheyWant.length === 0) return null

      const connectRequest = requestMap.get(matchedUserId) ?? null

      // Exclude fully-connected users — they belong on the /connections page
      // with their contact info revealed.
      if (connectRequest?.status === 'connected') return null

      return {
        user_id: matchedUserId,
        they_have_i_want: theyHaveIWant,
        i_have_they_want: iHaveTheyWant,
        connect_request: connectRequest,
      } satisfies Match
    })
    .filter((m): m is Match => m !== null)

  return matches
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function MatchesPage() {
  const { supabase, user } = await getCachedAuth()

  if (!user) {
    redirect('/auth/login?next=/matches')
  }

  const matches = await getMatches(user.id, supabase)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Disclaimer — AC #7 ------------------------------------------------ */}
      <div role="alert" className="disclaimer-banner flex gap-3">
        <span className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true">
          ⚠️
        </span>
        <p>
          <strong>Trade at your own risk.</strong> Users trade at their own
          risk — this platform takes no responsibility for trades. Always use
          good judgement when sharing your contact details.
        </p>
      </div>

      {/* Page header -------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Matches</h1>
        <p className="mt-1 text-sm text-gray-500">
          These collectors have pins you want <em>and</em> want pins you have —
          a perfect trade opportunity! Send a connect request and, once both
          sides accept, you&apos;ll each see the other&apos;s contact details.
        </p>
      </div>

      {/* Match list or empty state ------------------------------------------ */}
      {matches.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-gray-700">No mutual matches yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            Make sure you have marked which pins you{' '}
            <strong>have</strong> and which you <strong>want</strong> in your{' '}
            <a href="/dashboard" className="underline">
              dashboard
            </a>
            . Matches appear automatically when another collector has a
            complementary inventory.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {matches.map((match) => (
            <li key={match.user_id}>
              <MatchCard match={match} />
            </li>
          ))}
        </ul>
      )}

      {/* Connections footer link -------------------------------------------- */}
      <p className="text-center text-sm text-gray-400">
        Already accepted a request?{' '}
        <a href="/connections" className="underline">
          View your connections
        </a>{' '}
        to see contact details.
      </p>
    </div>
  )
}
