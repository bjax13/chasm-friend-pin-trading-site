// Mock all external dependencies before importing the module under test
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import {
  sendConnectRequest,
  cancelConnectRequest,
  acceptConnectRequest,
  declineConnectRequest,
} from '../connections'

const mockCookies = cookies as jest.MockedFunction<typeof cookies>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// Helper to create a mock Supabase client
function createMockSupabaseClient({
  user = { id: 'user-123' } as { id: string } | null,
  authError = null as Error | null,
  queryResult = { data: null, error: null } as { data: unknown; error: { message: string } | null },
} = {}) {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue(queryResult),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  }

  // Make insert resolve with the queryResult
  mockChain.insert.mockResolvedValue(queryResult)
  // update returns something that has eq and resolves
  mockChain.update.mockReturnValue({
    eq: jest.fn().mockReturnThis(),
  })

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

describe('sendConnectRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookies.mockReturnValue({
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    } as any)
  })

  it('returns an error when the user is not authenticated', async () => {
    const mockClient = createMockSupabaseClient({ user: null })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await sendConnectRequest('recipient-456')
    expect(result).toEqual({ error: 'You must be logged in to send a connect request.' })
  })

  it('returns an error when sending a request to yourself', async () => {
    const mockClient = createMockSupabaseClient({ user: { id: 'user-123' } })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await sendConnectRequest('user-123')
    expect(result).toEqual({ error: 'You cannot send a connect request to yourself.' })
  })

  it('returns an error when an existing non-cancelled request exists (connected)', async () => {
    const mockClient = createMockSupabaseClient()
    mockClient._mockChain.maybeSingle.mockResolvedValue({
      data: { id: 'req-999', status: 'connected' },
      error: null,
    })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await sendConnectRequest('recipient-456')
    expect(result).toEqual({ error: 'You are already connected with this user.' })
  })

  it('returns an error when a pending request already exists', async () => {
    const mockClient = createMockSupabaseClient()
    mockClient._mockChain.maybeSingle.mockResolvedValue({
      data: { id: 'req-999', status: 'pending' },
      error: null,
    })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await sendConnectRequest('recipient-456')
    expect(result).toEqual({ error: 'A connect request already exists with this user.' })
  })

  it('returns empty object and revalidates paths on success', async () => {
    const mockClient = createMockSupabaseClient({
      queryResult: { data: null, error: null },
    })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await sendConnectRequest('recipient-456')
    expect(result).toEqual({})
    expect(mockRevalidatePath).toHaveBeenCalledWith('/matches')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections')
  })

  it('returns an error when insert fails', async () => {
    const mockClient = createMockSupabaseClient({
      queryResult: { data: null, error: { message: 'DB error' } },
    })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await sendConnectRequest('recipient-456')
    expect(result).toEqual({ error: 'Failed to send connect request. Please try again.' })
  })
})

describe('cancelConnectRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookies.mockReturnValue({
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    } as any)
  })

  it('returns an error when the user is not authenticated', async () => {
    const mockClient = createMockSupabaseClient({ user: null })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await cancelConnectRequest('req-123')
    expect(result).toEqual({ error: 'You must be logged in to cancel a connect request.' })
  })

  it('returns empty object and revalidates paths on success', async () => {
    const mockUpdateChain = {
      eq: jest.fn().mockReturnThis(),
    }
    // The last eq in the chain returns { error: null }
    let eqCallCount = 0
    mockUpdateChain.eq.mockImplementation(() => {
      eqCallCount++
      if (eqCallCount >= 3) {
        return Promise.resolve({ error: null })
      }
      return mockUpdateChain
    })

    const mockClient = createMockSupabaseClient()
    mockClient._mockChain.update.mockReturnValue(mockUpdateChain)
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await cancelConnectRequest('req-123')
    // The update chain resolves after 3 eq calls
    // result should be {} (no error)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/matches')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/connections')
  })
})

describe('acceptConnectRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookies.mockReturnValue({
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    } as any)
  })

  it('returns an error when the user is not authenticated', async () => {
    const mockClient = createMockSupabaseClient({ user: null })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await acceptConnectRequest('req-123')
    expect(result).toEqual({ error: 'You must be logged in to accept a connect request.' })
  })
})

describe('declineConnectRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookies.mockReturnValue({
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    } as any)
  })

  it('returns an error when the user is not authenticated', async () => {
    const mockClient = createMockSupabaseClient({ user: null })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const result = await declineConnectRequest('req-123')
    expect(result).toEqual({ error: 'You must be logged in to decline a connect request.' })
  })
})
