import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import NavBar from '@/components/NavBar'
import './globals.css'

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
// We map Inter → the --font-geist-sans CSS variable that Tailwind expects.
// Swap to a local Geist font package if desired; the variable name is the
// only contract between here and tailwind.config.ts.
const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    default: 'ChasmFriend Pin Trading',
    template: '%s | ChasmFriend Pin Trading',
  },
  description:
    'Find trading partners for your ChasmFriend blind bag pins. Connect with other Brandon Sanderson fans and complete your collection.',
  openGraph: {
    title: 'ChasmFriend Pin Trading',
    description:
      'Find trading partners for your ChasmFriend blind bag pins. Connect with other Brandon Sanderson fans and complete your collection.',
    type: 'website',
  },
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p>
            ChasmFriend Pin Trading &mdash; a fan-made site for{' '}
            <a
              href="https://www.brandonsanderson.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-700"
            >
              Brandon Sanderson
            </a>{' '}
            fans. Not affiliated with Dragonsteel Entertainment.
          </p>
        </footer>
      </body>
    </html>
  )
}
