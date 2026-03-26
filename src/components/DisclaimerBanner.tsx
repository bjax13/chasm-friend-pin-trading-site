/**
 * DisclaimerBanner — prominent risk disclaimer displayed on the homepage
 * and the matching/trading page (AC #7).
 *
 * This is a pure presentational server component: no state, no client-side JS.
 */
export default function DisclaimerBanner() {
  return (
    <div
      role="alert"
      className="disclaimer-banner flex gap-3"
      aria-label="Trading risk disclaimer"
    >
      {/* Warning icon */}
      <span className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      </span>

      <p>
        <strong className="font-semibold">Trade at your own risk.</strong>{' '}
        This platform connects fans who want to swap ChasmFriend pins — it does
        not verify identities, guarantee shipments, or mediate disputes. All
        trades happen directly between users. We take no responsibility for
        outcomes.
      </p>
    </div>
  )
}
