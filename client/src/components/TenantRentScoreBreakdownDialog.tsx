import { createPortal } from 'react-dom'
import {
  formatTenantRentScoreContribution,
  TENANT_RENT_SCORE_BREAKDOWN_ROWS,
  tenantRentScoreBreakdownContribution,
  tenantRentScoreBreakdownMax,
  type TenantRentScoreDimensions,
} from '../lib/tenantRentScore'

function rentScoreBarColor(pct: number): { bg: string; border: string } {
  if (pct <= 25) return { bg: 'bg-red-500', border: 'border-red-500' }
  if (pct <= 50) return { bg: 'bg-orange-500', border: 'border-orange-500' }
  if (pct <= 75) return { bg: 'bg-amber-500', border: 'border-amber-500' }
  return { bg: 'bg-emerald-500', border: 'border-emerald-500' }
}

function BreakdownScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const { bg } = rentScoreBarColor(pct)
  return (
    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-200">
      <div className={`h-full rounded-full transition-[width] ${bg}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  overallScore: number
  dimensions: TenantRentScoreDimensions | null
  /** Tenant: “Based on your questionnaire.” Landlord: same idea, tenant-focused wording. */
  variant: 'tenant' | 'landlord'
}

export function TenantRentScoreBreakdownDialog({
  open,
  onClose,
  overallScore,
  dimensions,
  variant,
}: Props) {
  if (!open) return null

  const pct = Math.min(100, Math.max(0, overallScore))
  const { bg: overallBg, border: overallBorder } = rentScoreBarColor(pct)

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] bg-black/20" aria-hidden onClick={onClose} />
      <div
        className="fixed z-[101] w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        role="dialog"
        aria-labelledby="rent-score-breakdown-title"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span id="rent-score-breakdown-title" className="font-semibold text-gray-900">
            Rent Score breakdown
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold text-gray-800 ${overallBorder}`}
          >
            {overallScore}
          </span>
          <div className="min-w-[60px] flex-1 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className={`h-full rounded-full ${overallBg}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="space-y-2">
          {dimensions ? (
            TENANT_RENT_SCORE_BREAKDOWN_ROWS.map(({ key, emoji, label }) => {
              const score = dimensions[key] ?? 0
              const contribution = tenantRentScoreBreakdownContribution(key, score)
              const maxContribution = tenantRentScoreBreakdownMax(key)
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="w-5 shrink-0 text-center">{emoji}</span>
                  <span className="min-w-[8rem] text-gray-700">{label}</span>
                  <BreakdownScoreBar value={contribution} max={maxContribution} />
                  <span className="min-w-[8ch] text-right text-gray-500">
                    {formatTenantRentScoreContribution(contribution)} /{' '}
                    {formatTenantRentScoreContribution(maxContribution)}
                  </span>
                </div>
              )
            })
          ) : (
            <p className="py-2 text-xs text-gray-500">Loading dimension scores…</p>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {variant === 'tenant'
            ? 'Based on your questionnaire.'
            : 'Based on this tenant’s questionnaire.'}
        </p>
      </div>
    </>,
    document.body,
  )
}
