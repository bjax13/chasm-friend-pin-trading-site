import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ConnectButton from '../ConnectButton'

// Mock the server actions
jest.mock('@/actions/connections', () => ({
  sendConnectRequest: jest.fn(),
  cancelConnectRequest: jest.fn(),
}))

import { sendConnectRequest, cancelConnectRequest } from '@/actions/connections'

const mockSend = sendConnectRequest as jest.MockedFunction<typeof sendConnectRequest>
const mockCancel = cancelConnectRequest as jest.MockedFunction<typeof cancelConnectRequest>

describe('ConnectButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSend.mockResolvedValue({})
    mockCancel.mockResolvedValue({})
  })

  describe('when status is null (no request)', () => {
    it('renders a "Connect" button', () => {
      render(<ConnectButton recipientId="user-abc" requestId={null} status={null} />)
      expect(screen.getByRole('button', { name: /send a connect request/i })).toBeInTheDocument()
      expect(screen.getByText('Connect')).toBeInTheDocument()
    })

    it('calls sendConnectRequest with the recipientId on click', async () => {
      render(<ConnectButton recipientId="user-abc" requestId={null} status={null} />)
      fireEvent.click(screen.getByRole('button', { name: /send a connect request/i }))
      await waitFor(() => {
        expect(mockSend).toHaveBeenCalledWith('user-abc')
      })
    })

    it('shows error message when sendConnectRequest returns an error', async () => {
      mockSend.mockResolvedValue({ error: 'A connect request already exists with this user.' })
      render(<ConnectButton recipientId="user-abc" requestId={null} status={null} />)
      fireEvent.click(screen.getByRole('button', { name: /send a connect request/i }))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('A connect request already exists with this user.')
      })
    })

    it('does not show an error initially', () => {
      render(<ConnectButton recipientId="user-abc" requestId={null} status={null} />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('when status is "cancelled" (treated like no request)', () => {
    it('renders a "Connect" button when status is cancelled and requestId is null', () => {
      render(<ConnectButton recipientId="user-abc" requestId={null} status="cancelled" />)
      expect(screen.getByText('Connect')).toBeInTheDocument()
    })
  })

  describe('when status is "pending"', () => {
    it('renders the "Request sent" badge', () => {
      render(
        <ConnectButton recipientId="user-abc" requestId="req-123" status="pending" />
      )
      expect(screen.getByText('Request sent')).toBeInTheDocument()
    })

    it('renders a "Cancel request" button', () => {
      render(
        <ConnectButton recipientId="user-abc" requestId="req-123" status="pending" />
      )
      expect(screen.getByRole('button', { name: /cancel this connect request/i })).toBeInTheDocument()
    })

    it('calls cancelConnectRequest with the requestId on cancel click', async () => {
      render(
        <ConnectButton recipientId="user-abc" requestId="req-123" status="pending" />
      )
      fireEvent.click(screen.getByRole('button', { name: /cancel this connect request/i }))
      await waitFor(() => {
        expect(mockCancel).toHaveBeenCalledWith('req-123')
      })
    })

    it('shows error message when cancelConnectRequest returns an error', async () => {
      mockCancel.mockResolvedValue({ error: 'Failed to cancel connect request. Please try again.' })
      render(
        <ConnectButton recipientId="user-abc" requestId="req-123" status="pending" />
      )
      fireEvent.click(screen.getByRole('button', { name: /cancel this connect request/i }))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to cancel connect request')
      })
    })
  })

  describe('when status is "connected"', () => {
    it('renders a "Connected" link to /connections', () => {
      render(<ConnectButton recipientId="user-abc" requestId="req-123" status="connected" />)
      const link = screen.getByRole('link', { name: /connected/i })
      expect(link).toHaveAttribute('href', '/connections')
    })

    it('does not render a button', () => {
      render(<ConnectButton recipientId="user-abc" requestId="req-123" status="connected" />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
