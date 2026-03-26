jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mock the supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { upsertPinInventory, updateProfile } from '../inventory'

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

function createMockClient({
  user = { id: 'user-123' } as { id: string } | null,
  authError = null as Error | null,
  dbError = null as { message: string } | null,
} = {}) {
  const mockChain = {
    upsert: jest.fn().mockResolvedValue({ error: dbError }),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error: dbError }),
  }

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
    },
    from: jest.fn().mockReturnValue(mockChain),
    _mockChain: mockChain,
  }
}

describe('upsertPinInventory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns an error for an invalid pin name', async () => {
    const result = await upsertPinInventory('NotAPin' as any, true, false)
    expect(result).toEqual({ error: 'Invalid pin name.' })
  })

  it('returns an error when the user is not authenticated', async () => {
    const mockClient = createMockClient({ user: null })
    mockCreateClient.mockResolvedValue(mockClient as any)

    const result = await upsertPinInventory('Howlerina', true, false)
    expect(result).toEqual({ error: 'You must be logged in to update your pin inventory.' })
  })

  it('returns success when upsert succeeds', async () => {
    const mockClient = createMockClient()
    mockCreateClient.mockResolvedValue(mockClient as any)

    const result = await upsertPinInventory('Howlerina', true, false)
    expect(result).toEqual({ success: true })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('returns an error when the database upsert fails', async () => {
    const mockClient = createMockClient({ dbError: { message: 'DB constraint error' } })
    mockCreateClient.mockResolvedValue(mockClient as any)

    const result = await upsertPinInventory('Darren', false, true)
    expect(result).toEqual({ error: 'Failed to update pin inventory. Please try again.' })
  })

  it('accepts all valid pin names', async () => {
    const pins = ['Howlerina', 'Shredhead', 'Burpslurper', 'Cleverclaws', 'Darren'] as const
    for (const pin of pins) {
      const mockClient = createMockClient()
      mockCreateClient.mockResolvedValue(mockClient as any)
      const result = await upsertPinInventory(pin, true, true)
      expect(result).toEqual({ success: true })
    }
  })
})

describe('updateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns an error when the user is not authenticated', async () => {
    const mockClient = createMockClient({ user: null })
    mockCreateClient.mockResolvedValue(mockClient as any)

    const result = await updateProfile('', '')
    expect(result).toEqual({ error: 'You must be logged in to update your profile.' })
  })

  it('returns success when update succeeds', async () => {
    const mockClient = createMockClient()
    mockCreateClient.mockResolvedValue(mockClient as any)

    const result = await updateProfile('joe#1234', '@joetweets')
    expect(result).toEqual({ success: true })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('passes trimmed values to the database', async () => {
    const mockClient = createMockClient()
    mockCreateClient.mockResolvedValue(mockClient as any)

    await updateProfile('  joe#1234  ', '  @joetweets  ')
    // Verify the from chain was called
    expect(mockClient.from).toHaveBeenCalledWith('profiles')
    // Verify update was called with trimmed values
    expect(mockClient._mockChain.update).toHaveBeenCalledWith({
      discord_handle: 'joe#1234',
      social_handle: '@joetweets',
    })
  })

  it('converts empty strings to null', async () => {
    const mockClient = createMockClient()
    mockCreateClient.mockResolvedValue(mockClient as any)

    await updateProfile('', '')
    expect(mockClient._mockChain.update).toHaveBeenCalledWith({
      discord_handle: null,
      social_handle: null,
    })
  })

  it('converts whitespace-only strings to null', async () => {
    const mockClient = createMockClient()
    mockCreateClient.mockResolvedValue(mockClient as any)

    await updateProfile('   ', '   ')
    expect(mockClient._mockChain.update).toHaveBeenCalledWith({
      discord_handle: null,
      social_handle: null,
    })
  })

  it('returns an error when the database update fails', async () => {
    const mockClient = createMockClient({ dbError: { message: 'DB error' } })
    mockCreateClient.mockResolvedValue(mockClient as any)

    const result = await updateProfile('joe#1234', '')
    expect(result).toEqual({ error: 'Failed to update profile. Please try again.' })
  })
})
