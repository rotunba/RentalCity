export type TenantLeasePreferencesData = {
  lease_length_months: number | null
  move_in_date: string | null
  min_budget_cents: number | null
  max_budget_cents: number | null
  has_pets: boolean | null
  living_situation: string | null
}

export function hasTenantLeasePreferencesData(prefs: TenantLeasePreferencesData | null | undefined): boolean {
  if (!prefs) return false
  return (
    prefs.lease_length_months != null ||
    !!prefs.move_in_date ||
    prefs.min_budget_cents != null ||
    prefs.max_budget_cents != null ||
    prefs.has_pets != null ||
    (prefs.living_situation != null && prefs.living_situation.trim() !== '')
  )
}

export function TenantLeasePreferencesDisplay({ prefs }: { prefs: TenantLeasePreferencesData }) {
  return (
    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {prefs.lease_length_months != null && (
        <div>
          <p className="text-sm text-gray-500">Lease Duration</p>
          <p className="mt-1 text-sm text-gray-900">
            {prefs.lease_length_months < 12
              ? `${prefs.lease_length_months} months`
              : prefs.lease_length_months >= 24
                ? `${prefs.lease_length_months / 12}+ years`
                : `${prefs.lease_length_months / 12} year`}
          </p>
        </div>
      )}
      {prefs.move_in_date && (
        <div>
          <p className="text-sm text-gray-500">Move-in Date</p>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(prefs.move_in_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}
      {(prefs.min_budget_cents != null || prefs.max_budget_cents != null) && (
        <div>
          <p className="text-sm text-gray-500">Budget Range</p>
          <p className="mt-1 text-sm text-gray-900">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
              (prefs.min_budget_cents ?? 0) / 100,
            )}
            {' - '}
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
              (prefs.max_budget_cents ?? 0) / 100,
            )}
            /month
          </p>
        </div>
      )}
      {prefs.has_pets != null && (
        <div>
          <p className="text-sm text-gray-500">Pets</p>
          <p className="mt-1 text-sm text-gray-900">
            {prefs.has_pets ? (prefs.living_situation?.trim() || 'Yes') : 'No'}
          </p>
        </div>
      )}
      {prefs.living_situation?.trim() && prefs.has_pets !== false && (
        <div className="sm:col-span-2">
          <p className="text-sm text-gray-500">Living situation</p>
          <p className="mt-1 text-sm text-gray-900">{prefs.living_situation}</p>
        </div>
      )}
    </div>
  )
}
