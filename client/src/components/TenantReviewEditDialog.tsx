import { useEffect, useState } from 'react'
import { TENANT_REVIEW_PRIMARY_BUTTON_CLASSNAME } from './TenantReviewDisplay'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

export type TenantReviewEditExisting = {
  rating: number
  comment: string | null
  property_name: string | null
  property_address: string | null
} | null

type TenantReviewEditDialogProps = {
  open: boolean
  onClose: () => void
  tenantExternalId: string
  tenantDisplayName: string
  propertyCtx: { property_name: string; property_address: string } | null
  existingReview: TenantReviewEditExisting
  onSaved: () => void | Promise<void>
}

export function TenantReviewEditDialog({
  open,
  onClose,
  tenantExternalId,
  tenantDisplayName,
  propertyCtx,
  existingReview,
  onSaved,
}: TenantReviewEditDialogProps) {
  const { user } = useAuth()
  const [draftStars, setDraftStars] = useState(4)
  const [draftComment, setDraftComment] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraftStars(existingReview?.rating ?? 4)
    setDraftComment(existingReview?.comment?.trim() ?? '')
    setSaveError(null)
  }, [open, existingReview])

  async function handleSave() {
    if (!user || !UUID_RE.test(tenantExternalId)) return
    setSaving(true)
    setSaveError(null)

    const tenantUuid = tenantExternalId
    const pn = propertyCtx?.property_name ?? existingReview?.property_name ?? 'Listing'
    const pa = propertyCtx?.property_address ?? existingReview?.property_address ?? ''

    const { error } = await supabase.from('tenant_ratings').upsert(
      {
        landlord_id: user.id,
        tenant_id: tenantUuid,
        tenant_external_id: tenantExternalId,
        tenant_name: tenantDisplayName,
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

    await onSaved()
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <div
        className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tenant-review-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="tenant-review-edit-title" className="text-sm font-semibold text-gray-900">
            {existingReview ? 'Edit your review' : 'Your review'}
          </h2>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4">
          <StarPicker value={draftStars} onChange={setDraftStars} />
        </div>
        <label htmlFor="tenant-review-edit-comment" className="mt-6 block text-sm font-medium text-gray-800">
          Notes (optional)
        </label>
        <textarea
          id="tenant-review-edit-comment"
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
            {saving ? 'Saving…' : existingReview ? 'Save changes' : 'Submit review'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
