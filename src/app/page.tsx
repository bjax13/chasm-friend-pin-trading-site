/**
 * Homepage (/)
 *
 * Delivers AC #7 (prominent disclaimer) and AC #8 (about ChasmFriends +
 * BackerKit campaign link).
 *
 * This is a Server Component — no client-side JS needed.
 */

import Link from 'next/link'
import DisclaimerBanner from '@/components/DisclaimerBanner'
import { PIN_NAMES } from '@/lib/pins'

// ---------------------------------------------------------------------------
// Constant — update this URL to the exact BackerKit campaign page once live.
// ---------------------------------------------------------------------------
const BACKERKIT_URL =
  'https://www.backerkit.com/c/projects/dragonsteel-entertainment/hoids-storybook-collection'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-10">
      {/* ------------------------------------------------------------------ */}
      {/* Hero */}
      {/* ------------------------------------------------------------------ */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-800">
          ChasmFriend Pin Trading
        </h1>
        <p className="text-lg text-slate-600">
          Find other fans to swap your duplicate blind bag pins and complete
          your collection.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/auth/register" className="btn-primary no-underline">
            Get started — it&apos;s free
          </Link>
          <Link href="/auth/login" className="btn-secondary no-underline">
            Log in
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Disclaimer — AC #7 */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="disclaimer-heading">
        <h2 id="disclaimer-heading" className="sr-only">
          Trading disclaimer
        </h2>
        <DisclaimerBanner />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* About ChasmFriend Pins — AC #8 */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="about-heading"
        className="card space-y-4"
      >
        <h2 id="about-heading" className="text-xl font-semibold text-slate-800">
          What are ChasmFriend pins?
        </h2>
        <p className="text-slate-600">
          ChasmFriend pins are collectible enamel pins inspired by the world of
          Brandon Sanderson&apos;s{' '}
          <em>Stormlight Archive</em>. Each pin features one of five adorable
          characters from the{' '}
          <strong>Hoid&apos;s Storybook Collection</strong> BackerKit campaign:
        </p>

        {/* Pin list */}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="list">
          {PIN_NAMES.map((name) => (
            <li
              key={name}
              className="flex flex-col items-center rounded-lg border border-brand-200 bg-brand-50 px-3 py-4 text-center"
            >
              {/* Placeholder pin icon */}
              <span className="text-3xl" aria-hidden="true">
                📌
              </span>
              <span className="mt-1 text-sm font-medium text-brand-800">
                {name}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-slate-600">
          Pins are distributed as <strong>blind bags</strong> — you don&apos;t
          know which character you&apos;ll receive. Many fans end up with
          duplicates and gaps in their collection. This site makes it easy to
          find a mutual trading partner.
        </p>

        <a
          href={BACKERKIT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium underline"
        >
          View the Hoid&apos;s Storybook Collection campaign on BackerKit
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="how-heading" className="space-y-4">
        <h2
          id="how-heading"
          className="text-xl font-semibold text-slate-800"
        >
          How it works
        </h2>
        <ol className="space-y-3 text-slate-600" role="list">
          {[
            {
              title: 'Create an account',
              body: 'Register with your email. Optionally add your Discord or social handle so trading partners can reach you.',
            },
            {
              title: 'Mark your inventory',
              body: 'Tell us which of the 5 pins you have (available to trade) and which you want.',
            },
            {
              title: 'Find mutual matches',
              body: 'We surface fans who have a pin you want AND want a pin you have — a win-win trade.',
            },
            {
              title: 'Connect safely',
              body: 'Send a connect request. Contact details are only revealed once both parties accept.',
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-800">{step.title}</p>
                <p className="text-sm">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="pt-2">
          <Link href="/auth/register" className="btn-primary no-underline">
            Start trading
          </Link>
        </div>
      </section>
    </div>
  )
}
