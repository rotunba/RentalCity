import { Link } from 'react-router-dom'
import { TenantAvatar } from './TenantAvatar'
import { formatTenantReviewDate, ReviewStarsReadOnly } from './TenantReviewDisplay'
import { type LandlordRatingGivenRow, useLandlordRatingsGiven } from '../lib/useLandlordRatingsGiven'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type LandlordRatingsGivenCardProps = {
  /**
   * When a number, only that many most recent rows are listed on the account home,
   * with a link to the full list when there are more. Pass `null` to show every row (full page).
   */
  maxPreviewItems?: number | null
  /** Omit title + helper when the parent page already shows them. */
  hideHeader?: boolean
  className?: string
}

function RatingListItem({ row, returnTo }: { row: LandlordRatingGivenRow; returnTo: string }) {
  const tenantUuid = UUID_RE.test(row.tenant_external_id) ? row.tenant_external_id : null
  const displayName = row.tenant?.display_name?.trim() || row.tenant_name?.trim() || 'Tenant'
  const avatarUrl = row.tenant?.avatar_url ?? null
  const propertyLine = row.property_name?.trim() || row.property_address?.trim() || 'Listing'
  const reviewsHref = tenantUuid
    ? `/matches/tenant/${encodeURIComponent(tenantUuid)}/reviews?${new URLSearchParams({
        returnTo,
      }).toString()}`
    : null

  return (
    <li className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <TenantAvatar name={displayName} avatarUrl={avatarUrl} sizeClass="h-12 w-12" textClass="text-xs" />
          <div className="min-w-0">
            {tenantUuid ? (
              <Link
                to={`/matches/tenant/${encodeURIComponent(tenantUuid)}`}
                state={{ from: returnTo }}
                className="text-sm font-semibold text-gray-900 hover:underline"
              >
                {displayName}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            )}
            <p className="mt-0.5 text-xs text-gray-500">{propertyLine}</p>
            <p className="mt-1 text-xs text-gray-500">{formatTenantReviewDate(row.created_at)}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ReviewStarsReadOnly value={row.rating} />
          {reviewsHref ? (
            <Link
              to={reviewsHref}
              className="text-xs font-medium text-gray-800 underline decoration-gray-400 underline-offset-2 hover:text-gray-900"
            >
              Edit review
            </Link>
          ) : null}
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
        {row.comment?.trim() || <span className="text-gray-400">No written comment.</span>}
      </p>
    </li>
  )
}

/** Landlord Account: lists tenant ratings this landlord submitted. */
export function LandlordRatingsGivenCard({
  maxPreviewItems = 5,
  hideHeader = false,
  className = '',
}: LandlordRatingsGivenCardProps = {}) {
  const { rows, loading, loadError, returnTo } = useLandlordRatingsGiven()
  const limit = maxPreviewItems == null ? null : maxPreviewItems
  const displayedRows = limit != null ? rows.slice(0, limit) : rows
  const hasMore = limit != null && rows.length > limit

  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`.trim()}>
      {hideHeader ? null : (
        <>
          <h2 className="mb-1 text-sm font-medium text-gray-900">Ratings you&apos;ve given</h2>
          <p className="mb-4 text-xs leading-5 text-gray-500">
            Every tenant rating and comment you&apos;ve submitted. Open a tenant to update your review from their
            profile.
          </p>
        </>
      )}

      {loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-600">
          You haven&apos;t submitted any tenant ratings yet.{' '}
          <Link to="/matches" className="font-medium text-gray-900 underline decoration-gray-400 underline-offset-2">
            Browse matches
          </Link>
        </p>
      ) : (
        <>
          <ul className="space-y-4">
            {displayedRows.map((row) => (
              <RatingListItem key={row.id} row={row} returnTo={returnTo} />
            ))}
          </ul>
          {hasMore ? (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <Link
                to="/account/ratings-given"
                className="text-sm font-medium text-gray-900 underline decoration-gray-400 underline-offset-2 hover:decoration-gray-600"
              >
                See all {rows.length} ratings
              </Link>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
