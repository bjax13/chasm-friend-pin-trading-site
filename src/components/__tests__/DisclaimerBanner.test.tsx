import { render, screen } from '@testing-library/react'
import DisclaimerBanner from '../DisclaimerBanner'

describe('DisclaimerBanner', () => {
  it('renders without crashing', () => {
    render(<DisclaimerBanner />)
  })

  it('has role="alert" for accessibility', () => {
    render(<DisclaimerBanner />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('has the correct aria-label', () => {
    render(<DisclaimerBanner />)
    expect(screen.getByLabelText('Trading risk disclaimer')).toBeInTheDocument()
  })

  it('displays the "Trade at your own risk" heading', () => {
    render(<DisclaimerBanner />)
    expect(screen.getByText(/trade at your own risk/i)).toBeInTheDocument()
  })

  it('mentions that the platform takes no responsibility', () => {
    render(<DisclaimerBanner />)
    expect(screen.getByText(/no responsibility/i)).toBeInTheDocument()
  })

  it('mentions that trades happen directly between users', () => {
    render(<DisclaimerBanner />)
    expect(screen.getByText(/directly between users/i)).toBeInTheDocument()
  })

  it('contains the warning SVG icon with aria-hidden', () => {
    const { container } = render(<DisclaimerBanner />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // SVG icon wrapper should be aria-hidden since the text carries the meaning
    const svgWrapper = container.querySelector('[aria-hidden="true"]')
    expect(svgWrapper).toBeInTheDocument()
  })
})
