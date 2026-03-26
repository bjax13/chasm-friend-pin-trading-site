/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

// Mock NextResponse
const mockRedirect = jest.fn((url: string) => ({ type: 'redirect', url, headers: new Headers() }))
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: string | URL) => mockRedirect(url.toString()),
    next: jest.fn(() => ({ headers: new Headers() })),
  },
  NextRequest: jest.requireActual('next/server').NextRequest,
}))

import { createServerClient } from '@supabase/ssr'
import { GET } from '../route'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

function createMockSupabaseAuth({
  exchangeError = null as { message: string } | null,
} = {}) {
  return {
    auth: {
      exchangeCodeForSession: jest.fn().mockResolvedValue({ error: exchangeError }),
    },
    from: jest.fn(),
  }
}

function makeRequest(url: string) {
  return new NextRequest(url)
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to /auth/login?error=missing_code when no code param is provided', async () => {
    const request = makeRequest('https://example.com/auth/callback')
    await GET(request)
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login?error=missing_code')
    )
  })

  it('redirects to /auth/login?error=exchange_failed when code exchange fails', async () => {
    const mockClient = createMockSupabaseAuth({ exchangeError: { message: 'Token expired' } })
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const request = makeRequest('https://example.com/auth/callback?code=invalid-code')
    await GET(request)
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login?error=exchange_failed')
    )
  })

  it('redirects to /dashboard on successful code exchange', async () => {
    const mockClient = createMockSupabaseAuth()
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const request = makeRequest('https://example.com/auth/callback?code=valid-code')
    await GET(request)
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/dashboard')
    )
  })

  it('redirects to the next param on success when it is a valid relative path', async () => {
    const mockClient = createMockSupabaseAuth()
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const request = makeRequest('https://example.com/auth/callback?code=valid-code&next=/matches')
    await GET(request)
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/matches')
    )
  })

  it('redirects to /dashboard instead of an external URL (open-redirect guard)', async () => {
    const mockClient = createMockSupabaseAuth()
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const request = makeRequest(
      'https://example.com/auth/callback?code=valid-code&next=https://evil.com'
    )
    await GET(request)
    // Should redirect to /dashboard, NOT to https://evil.com
    const redirectUrl = mockRedirect.mock.calls[0][0] as string
    expect(redirectUrl).not.toContain('evil.com')
    expect(redirectUrl).toContain('/dashboard')
  })
})
