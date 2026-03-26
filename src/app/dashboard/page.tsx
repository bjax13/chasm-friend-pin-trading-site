import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PinGrid from '@/components/PinGrid'
import ProfileForm from './ProfileForm'
import type { PinInventory, Profile } from '@/lib/types'

export const metadata = {
  title: 'My Dashboard — ChasmFriend Pin Trading',
}

// ---------------------------------------------------------------------------
// Dashboard page — server component
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createClient()

  // Auth guard — middleware also handles this, but we check here for safety.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Fetch the user's pin inventory.
  const { data: inventoryRows, error: inventoryError } = await supabase
    .from('pin_inventory')
    .select('*')
    .eq('user_id', user.id)

  if (inventoryError) {
    console.error('[dashboard] inventory fetch error:', inventoryError.message)
  }

  const inventory: PinInventory[] = inventoryRows ?? []

  // Fetch the user's profile (discord_handle, social_handle).
  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[dashboard] profile fetch error:', profileError.message)
  }

  const profile: Profile | null = profileRow ?? null

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Page heading */}
      <h1 className="mb-8 text-3xl font-bold text-brand-900">My Dashboard</h1>

      {/* ── Pin Inventory ─────────────────────────────────────────────────── */}
      <section aria-labelledby="pin-inventory-heading" className="mb-12">
        <h2
          id="pin-inventory-heading"
          className="mb-1 text-xl font-semibold text-brand-800"
        >
          Pin Inventory
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          Toggle which ChasmFriend pins you <strong>have</strong> (available to
          trade) and which ones you <strong>want</strong>. You can mark a pin as
          both if you already have one but would love a spare!
        </p>

        <PinGrid pins={inventory} />
      </section>

      {/* ── Profile & Contact Info ─────────────────────────────────────────── */}
      <section aria-labelledby="profile-heading">
        <h2
          id="profile-heading"
          className="mb-1 text-xl font-semibold text-brand-800"
        >
          Profile &amp; Contact Info
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          Your contact details are only shared with users you have{' '}
          <strong>mutually accepted</strong> a trade connection with. You do not
          need to fill these in to browse matches, but trading partners
          won&rsquo;t be able to reach you without them.
        </p>

        <ProfileForm
          initialDiscordHandle={profile?.discord_handle ?? ''}
          initialSocialHandle={profile?.social_handle ?? ''}
        />

        {/* Contact-sharing disclaimer */}
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <strong>Note:</strong> Sharing contact details is optional, but
          required to complete a trade. This site takes no responsibility for
          how your contact information is used once shared with another user.
        </p>
      </section>
    </main>
  )
}
