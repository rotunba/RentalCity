import type { TenantInviteRestrictionState } from '../lib/useTenantInviteRestriction'

export function TenantInviteBanner({ restriction }: { restriction: Extract<TenantInviteRestrictionState, { active: true }> }) {
  const end = new Date(restriction.endsAt)
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">Invited guest mode</p>
      <p className="mt-1 text-amber-900/90">
        You&apos;re only seeing listings from <span className="font-medium">{restriction.landlordLabel}</span> until{' '}
        <span className="font-medium">{endLabel}</span>. After that you can browse and apply everywhere on Rental City.
      </p>
    </div>
  )
}
