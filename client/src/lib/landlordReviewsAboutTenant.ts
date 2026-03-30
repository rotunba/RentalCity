/** Rows from `tenant_ratings` with embedded landlord display_name (tenant’s own profile / full list). */
export type LandlordReviewAboutTenantRow = {
  id: string
  rating: number
  comment: string | null
  property_name: string | null
  property_address: string | null
  created_at: string
  landlord?: { display_name: string | null } | null
}

export function normalizeLandlordReviewRows(rows: LandlordReviewAboutTenantRow[]): LandlordReviewAboutTenantRow[] {
  return rows.map((r) => ({
    ...r,
    landlord: Array.isArray(r.landlord) ? r.landlord[0] ?? null : r.landlord ?? null,
  }))
}
