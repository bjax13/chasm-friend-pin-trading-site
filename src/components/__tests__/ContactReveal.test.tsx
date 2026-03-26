import { render, screen } from '@testing-library/react'
import ContactReveal from '../ContactReveal'

const baseProps = {
  displayName: 'TraderJoe',
  email: 'joe@example.com',
}

describe('ContactReveal', () => {
  it('renders without crashing', () => {
    render(<ContactReveal {...baseProps} />)
  })

  it('displays the contact info heading with the display name', () => {
    render(<ContactReveal {...baseProps} />)
    expect(screen.getByText(/contact info for traderjoe/i)).toBeInTheDocument()
  })

  it('renders the email as a mailto link', () => {
    render(<ContactReveal {...baseProps} />)
    const link = screen.getByRole('link', { name: /joe@example\.com/i })
    expect(link).toHaveAttribute('href', 'mailto:joe@example.com')
  })

  it('shows the Discord handle when provided', () => {
    render(<ContactReveal {...baseProps} discordHandle="joe#1234" />)
    expect(screen.getByText('joe#1234')).toBeInTheDocument()
    expect(screen.getByText('Discord')).toBeInTheDocument()
  })

  it('shows the social handle when provided', () => {
    render(<ContactReveal {...baseProps} socialHandle="@joetweets" />)
    expect(screen.getByText('@joetweets')).toBeInTheDocument()
    expect(screen.getByText('Social')).toBeInTheDocument()
  })

  it('does not render Discord section when discordHandle is null', () => {
    render(<ContactReveal {...baseProps} discordHandle={null} />)
    expect(screen.queryByText('Discord')).not.toBeInTheDocument()
  })

  it('does not render Discord section when discordHandle is undefined', () => {
    render(<ContactReveal {...baseProps} />)
    expect(screen.queryByText('Discord')).not.toBeInTheDocument()
  })

  it('does not render Social section when socialHandle is null', () => {
    render(<ContactReveal {...baseProps} socialHandle={null} />)
    expect(screen.queryByText('Social')).not.toBeInTheDocument()
  })

  it('shows "reach out via email" fallback message when no extra contact info', () => {
    render(<ContactReveal {...baseProps} discordHandle={null} socialHandle={null} />)
    expect(screen.getByText(/reach out via email/i)).toBeInTheDocument()
  })

  it('does NOT show fallback message when discord handle is provided', () => {
    render(<ContactReveal {...baseProps} discordHandle="joe#1234" />)
    expect(screen.queryByText(/reach out via email/i)).not.toBeInTheDocument()
  })

  it('does NOT show fallback message when social handle is provided', () => {
    render(<ContactReveal {...baseProps} socialHandle="@joetweets" />)
    expect(screen.queryByText(/reach out via email/i)).not.toBeInTheDocument()
  })

  it('shows both Discord and Social when both are provided', () => {
    render(
      <ContactReveal
        {...baseProps}
        discordHandle="joe#1234"
        socialHandle="@joetweets"
      />
    )
    expect(screen.getByText('joe#1234')).toBeInTheDocument()
    expect(screen.getByText('@joetweets')).toBeInTheDocument()
    expect(screen.queryByText(/reach out via email/i)).not.toBeInTheDocument()
  })

  it('renders with a green-themed card container', () => {
    const { container } = render(<ContactReveal {...baseProps} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).toMatch(/green/)
  })
})
