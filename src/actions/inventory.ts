'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PinName } from '@/lib/types'
import { isPinName } from '@/lib/pins'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionResult = { error: string } | { success: true }

// ---------------------------------------------------------------------------
// upsertPinInventory
// ---------------------------------------------------------------------------

/**
 * Upserts a single pin entry in the `pin_inventory` table for the current
 * authenticated user.
 *
 * @param pinName  One of the 5 ChasmFriend pin names.
 * @param hasIt    Whether the user has this pin (available to trade).
 * @param wantsIt  Whether the user wants this pin.
 */
export async function upsertPinInventory(
  pinName: PinName,
  hasIt: boolean,
  wantsIt: boolean
): Promise<ActionResult> {
  if (!isPinName(pinName)) {
    return { error: 'Invalid pin name.' }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to update your pin inventory.' }
  }

  const { error } = await supabase.from('pin_inventory').upsert(
    {
      user_id: user.id,
      pin_name: pinName,
      has_it: hasIt,
      wants_it: wantsIt,
    },
    { onConflict: 'user_id,pin_name' }
  )

  if (error) {
    console.error('[upsertPinInventory] error:', error.message)
    return { error: 'Failed to update pin inventory. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

/**
 * Updates the `discord_handle` and `social_handle` fields on the current
 * user's profile row.
 *
 * @param discordHandle  Discord username (e.g. "username#1234" or just "username").
 * @param socialHandle   Any social media handle the user wants to share.
 */
export async function updateProfile(
  discordHandle: string,
  socialHandle: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to update your profile.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      discord_handle: discordHandle.trim() || null,
      social_handle: socialHandle.trim() || null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('[updateProfile] error:', error.message)
    return { error: 'Failed to update profile. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
