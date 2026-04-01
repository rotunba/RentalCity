export async function fetchTenantLandlordProfile(
  accessToken: string,
  params: { propertyId?: string | null; landlordId?: string | null },
): Promise<{
  profile: {
    display_name: string | null
    avatar_url: string | null
    phone: string | null
    bio: string | null
    city: string | null
    created_at: string | null
  }
} | null> {
  const q = new URLSearchParams()
  if (params.propertyId) q.set('propertyId', params.propertyId)
  if (params.landlordId) q.set('landlordId', params.landlordId)
  const res = await fetch(`/api/tenant/landlord-profile?${q.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 403 || res.status === 404) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to load landlord profile')
  }
  return (await res.json()) as any
}

