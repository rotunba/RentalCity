import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { TenantAvatar } from '../components/TenantAvatar'
import {
  TENANT_REVIEWS_CARD_TITLE,
  TENANT_REVIEWS_DESCRIPTION_AS_LANDLORD,
  TENANT_REVIEW_PRIMARY_BUTTON_CLASSNAME,
  TenantReviewListRowContent,
} from '../components/TenantReviewDisplay'
import { useAuth } from '../lib/useAuth'
import { safeInternalPath } from '../lib/safeInternalPath'
import { supabase } from '../lib/supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ReviewListItem = {
  id: string
  landlord_id: string
  rating: number
  comment: string | null
  property_name: string | null
  property_address: string | null
  created_at: string
  landlord?: { display_name: string | null } | null
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500">Overall</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded-md p-1 transition-colors ${n <= value ? 'text-amber-500' : 'text-gray-200 hover:text-gray-300'}`}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            <svg className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.036 3.19a1 1 0 00.95.69h3.354c.969 0 1.371 1.24.588 1.81l-2.714 1.972a1 1 0 00-.364 1.118l1.036 3.19c.3.921-.755 1.688-1.539 1.118l-2.714-1.972a1 1 0 00-1.176 0l-2.714 1.972c-.783.57-1.838-.197-1.539-1.118l1.036-3.19a1 1 0 00-.364-1.118L2.17 8.617c-.783-.57-.38-1.81.588-1.81h3.354a1 1 0 00.95-.69l1.036-3.19z" />
            </svg>
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-gray-800">{value} / 5</span>
    </div>
  )
}

function normalizeReviews(rows: unknown): ReviewListItem[] {
  const list = (rows ?? []) as ReviewListItem[]
  return list.map((r) => ({
    ...r,
    landlord: Array.isArray(r.landlord) ? r.landlord[0] ?? null : r.landlord ?? null,
  }))
}

export function LandlordTenantReviewsPage() {
  const { user } = useAuth()
  const { id: tenantIdParam = '' } = useParams()
  const [searchParams] = useSearchParams()
  const propertyParam = searchParams.get('property')
  const applicationParam = searchParams.get('application')

  const returnTo = useMemo(() => {
    return safeInternalPath(searchParams.get('returnTo')) ?? `/matches/tenant/${tenantIdParam}`
  }, [searchParams, tenantIdParam])

  const [tenantName, setTenantName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [allReviews, setAllReviews] = useState<ReviewListItem[]>([])
  const [propertyCtx, setPropertyCtx] = useState<{ property_name: string; property_address: string } | null>(null)

  const [editing, setEditing] = useState(false)
  const [draftStars, setDraftStars] = useState(4)
  const [draftComment, setDraftComment] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const tenantIdValid = UUID_RE.test(tenantIdParam)

  const myReview = useMemo(
    () => (user ? allReviews.find((r) => r.landlord_id === user.id) ?? null : null),
    [allReviews, user],
  )

  const loadAll = useCallback(async () => {
    if (!user || !tenantIdValid) {
      setLoading(false)
      return
    }

    setLoading(true)
    setSaveError(null)

    const [{ data: profile }, { data: ratingsRaw }, { data: apps }] = await Promise.all([
      supabase.from('profiles').select('display_name, avatar_url').eq('id', tenantIdParam).maybeSingle(),
      supabase
        .from('tenant_ratings')
        .select(
          'id, landlord_id, rating, comment, property_name, property_address, created_at, landlord:landlord_id(display_name)',
        )
        .eq('tenant_external_id', tenantIdParam)
        .order('created_at', { ascending: false }),
      supabase
        .from('applications')
        .select(
          'id, property_id, status, property:property_id(landlord_id, title, address_line1, city, state)',
        )
        .eq('tenant_id', tenantIdParam)
        .in('status', ['approved', 'pending']),
    ])

    setTenantName(profile?.display_name?.trim() || 'Tenant')
    setAvatarUrl(profile?.avatar_url ?? null)
    setAllReviews(normalizeReviews(ratingsRaw))

    type P = { landlord_id: string; title: string | null; address_line1: string; city: string; state: string | null }
    type AppRow = { id: string; property_id: string; status: string; property: P | null }
    const rows = ((apps ?? []) as unknown as AppRow[]).filter((a) => a.property?.landlord_id === user.id)
    const appIdOk =
      applicationParam && UUID_RE.test(applicationParam) ? applicationParam : null
    const preferred =
      appIdOk && rows.some((r) => r.id === appIdOk)
        ? rows.find((r) => r.id === appIdOk)
        : propertyParam && rows.some((r) => r.property_id === propertyParam)
          ? rows.find((r) => r.property_id === propertyParam)
          : rows.find((r) => r.status === 'approved') ?? rows[0]

    if (preferred?.property) {
      const p = preferred.property
      const name = p.title?.trim() || p.address_line1
      const address = [p.address_line1, p.city, p.state].filter(Boolean).join(', ')
      setPropertyCtx({ property_name: name, property_address: address })
    } else {
      setPropertyCtx(null)
    }

    setLoading(false)
  }, [user, tenantIdParam, tenantIdValid, propertyParam, applicationParam])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  function startEditMine() {
    const mine = user ? allReviews.find((r) => r.landlord_id === user.id) : null
    setDraftStars(mine?.rating ?? 4)
    setDraftComment(mine?.comment?.trim() ?? '')
    setSaveError(null)
    setEditing(true)
  }

  function handleCancelEdit() {
    setSaveError(null)
    setEditing(false)
    const mine = user ? allReviews.find((r) => r.landlord_id === user.id) : null
    setDraftStars(mine?.rating ?? 4)
    setDraftComment(mine?.comment ?? '')
  }

  async function handleSave() {
    if (!user || !tenantIdValid) return
    setSaving(true)
    setSaveError(null)

    const tenantUuid = UUID_RE.test(tenantIdParam) ? tenantIdParam : null
    const mine = allReviews.find((r) => r.landlord_id === user.id)
    const pn = propertyCtx?.property_name ?? mine?.property_name ?? 'Listing'
    const pa = propertyCtx?.property_address ?? mine?.property_address ?? ''

    const { error } = await supabase.from('tenant_ratings').upsert(
      {
        landlord_id: user.id,
        tenant_id: tenantUuid,
        tenant_external_id: tenantIdParam,
        tenant_name: tenantName ?? 'Tenant',
        property_name: pn,
        property_address: pa,
        rating: draftStars,
        comment: draftComment.trim() || null,
      },
      { onConflict: 'landlord_id,tenant_external_id' },
    )

    setSaving(false)

    if (error) {
      setSaveError(error.message)
      return
    }

    await loadAll()
    setEditing(false)
  }

  if (!tenantIdValid) {
    return (
      <div className="px-4 py-8">
        <p className="text-sm text-gray-600">Invalid tenant.</p>
        <Link to="/matches" className="mt-4 inline-block text-sm font-medium text-gray-900 underline">
          Back to matches
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col px-4 py-4">
      <Link
        to={returnTo}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to profile
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <TenantAvatar name={tenantName ?? 'Tenant'} avatarUrl={avatarUrl} />
        <div>
          <h1 className="text-[1.6rem] font-medium text-gray-900">{TENANT_REVIEWS_CARD_TITLE}</h1>
          <p className="mt-1 text-sm text-gray-600">{tenantName}</p>
          <p className="mt-3 text-sm leading-6 text-gray-500">{TENANT_REVIEWS_DESCRIPTION_AS_LANDLORD}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="w-full space-y-6">
          {editing ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-gray-900">{myReview ? 'Edit your review' : 'Your review'}</h2>
              <div className="mt-4">
                <StarPicker value={draftStars} onChange={setDraftStars} />
              </div>
              <label htmlFor="review-comment" className="mt-6 block text-sm font-medium text-gray-800">
                Notes (optional)
              </label>
              <textarea
                id="review-comment"
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
                rows={5}
                placeholder="Parking, communications, move-in condition, rent payments…"
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
              />
              {propertyCtx ? (
                <p className="mt-3 text-xs text-gray-500">
                  Listing context: {propertyCtx.property_name}
                  {propertyCtx.property_address ? ` — ${propertyCtx.property_address}` : ''}
                </p>
              ) : null}
              {saveError ? <p className="mt-3 text-sm text-red-600">{saveError}</p> : null}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className={TENANT_REVIEW_PRIMARY_BUTTON_CLASSNAME}
                >
                  {saving ? 'Saving…' : myReview ? 'Save changes' : 'Submit review'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCancelEdit}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {TENANT_REVIEWS_CARD_TITLE} ({allReviews.length})
            </h2>
            <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {allReviews.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">No reviews yet.</p>
              ) : (
                allReviews.map((r) => {
                  const isMine = user?.id === r.landlord_id
                  const name = isMine
                    ? 'You'
                    : r.landlord?.display_name?.trim() || r.landlord?.display_name || 'Landlord'
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <TenantReviewListRowContent
                          authorLabel={name}
                          createdAtIso={r.created_at}
                          rating={r.rating}
                          propertyName={r.property_name}
                          propertyAddress={r.property_address}
                          comment={r.comment}
                        />
                      </div>
                      {isMine && !editing ? (
                        <button
                          type="button"
                          onClick={startEditMine}
                          className={`shrink-0 self-start ${TENANT_REVIEW_PRIMARY_BUTTON_CLASSNAME}`}
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {!editing && !myReview ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-6 text-center">
              <p className="text-sm text-gray-600">You haven&apos;t reviewed this tenant yet.</p>
              <button
                type="button"
                onClick={startEditMine}
                className={`mt-4 ${TENANT_REVIEW_PRIMARY_BUTTON_CLASSNAME}`}
              >
                Write a review
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
