'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'

function createSupabaseServerClient() {
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
            // Server Component context — middleware keeps session refreshed
          }
        },
      },
    }
  )
}

/**
 * Send a connect request to another user.
 * Idempotent: if a cancelled request already exists between these users
 * it will be re-opened as pending rather than creating a duplicate.
 */
export async function sendConnectRequest(
  recipientId: string
): Promise<{ error?: string }> {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to send a connect request.' }
  }

  if (user.id === recipientId) {
    return { error: 'You cannot send a connect request to yourself.' }
  }

  // Check for an existing non-cancelled request between these two users
  const { data: existing } = await supabase
    .from('connect_requests')
    .select('id, status')
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),` +
        `and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`
    )
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existing) {
    return {
      error:
        existing.status === 'connected'
          ? 'You are already connected with this user.'
          : 'A connect request already exists with this user.',
    }
  }

  const { error: insertError } = await supabase
    .from('connect_requests')
    .insert({
      requester_id: user.id,
      recipient_id: recipientId,
      status: 'pending',
    })

  if (insertError) {
    console.error('[connections] sendConnectRequest error:', insertError.message)
    return { error: 'Failed to send connect request. Please try again.' }
  }

  revalidatePath('/matches')
  revalidatePath('/connections')
  return {}
}

/**
 * Cancel a pending connect request that the current user sent.
 */
export async function cancelConnectRequest(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to cancel a connect request.' }
  }

  const { error: updateError } = await supabase
    .from('connect_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('requester_id', user.id) // Only the requester can cancel
    .eq('status', 'pending')

  if (updateError) {
    console.error(
      '[connections] cancelConnectRequest error:',
      updateError.message
    )
    return { error: 'Failed to cancel connect request. Please try again.' }
  }

  revalidatePath('/matches')
  revalidatePath('/connections')
  return {}
}

/**
 * Accept an incoming connect request.
 * Sets the request status to 'connected', which unlocks contact info for both parties.
 */
export async function acceptConnectRequest(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to accept a connect request.' }
  }

  const { error: updateError } = await supabase
    .from('connect_requests')
    .update({ status: 'connected' })
    .eq('id', requestId)
    .eq('recipient_id', user.id) // Only the recipient can accept
    .eq('status', 'pending')

  if (updateError) {
    console.error(
      '[connections] acceptConnectRequest error:',
      updateError.message
    )
    return { error: 'Failed to accept connect request. Please try again.' }
  }

  revalidatePath('/connections')
  revalidatePath('/matches')
  return {}
}

/**
 * Decline an incoming connect request.
 * Sets the request status to 'cancelled' so it no longer appears.
 */
export async function declineConnectRequest(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to decline a connect request.' }
  }

  const { error: updateError } = await supabase
    .from('connect_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('recipient_id', user.id) // Only the recipient can decline
    .eq('status', 'pending')

  if (updateError) {
    console.error(
      '[connections] declineConnectRequest error:',
      updateError.message
    )
    return { error: 'Failed to decline connect request. Please try again.' }
  }

  revalidatePath('/connections')
  return {}
}
