import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatBedrooms, formatBathrooms, formatCurrency } from '../lib/propertyDraft'
import { useAuth } from '../lib/useAuth'
import { useProfileRole } from '../lib/useProfileRole'
import { supabase } from '../lib/supabase'

type MatchCard = {
  id: string
  title: string
  location: string
  price: string
  saved: boolean
  compatibility: string
  tags: string[]
  bedrooms: number
  monthly_rent_cents: number
  amenitiesList: string[]
}

type ProfileRole = 'tenant' | 'landlord'

type LandlordMatchStatus = 'locked' | 'unlocked' | 'accepted' | 'declined'

type LandlordMatchCard = {
  id: string
  tenantId: string
  name: string
  appliedAgo: string
  status: LandlordMatchStatus
  compatibilitySummary: string
  creditScore: string
  tenantScore: string
  leaseIntent: string
}

const SAVED_IDS_KEY = 'rental-city-saved-matches'

function formatRelativeTime(createdAt: string) {
  const date = new Date(createdAt)
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'Applied today'
  if (diffDays === 1) return 'Applied 1 day ago'
  if (diffDays < 7) return `Applied ${diffDays} days ago`
  return `Applied ${Math.floor(diffDays / 7)} weeks ago`
}

// Match states: locked (must unlock first), unlocked (can accept or deny), accepted, declined.
// Only an unlocked match can be accepted or denied.
function applicationStatusToMatch(status: string, unlockedAt: string | null): LandlordMatchStatus {
  if (status === 'approved') return 'accepted'
  if (status === 'rejected') return 'declined'
  if (status === 'pending' && unlockedAt) return 'unlocked'
  if (status === 'pending') return 'locked'
  return 'locked'
}

function LandlordAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#d6c7ba,_#8a6f5a)] text-xs font-medium text-white">
      {initials}
    </div>
  )
}

function loadSavedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SAVED_IDS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveSavedIds(ids: Set<string>) {
  localStorage.setItem(SAVED_IDS_KEY, JSON.stringify([...ids]))
}

export function YourMatchesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
const { role: profileRole, displayName, landlordSurveyCompletedAt, tenantSurveyCompletedAt, loading: roleLoading } = useProfileRole(user)
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all')
  const [bedrooms, setBedrooms] = useState('any')
  const [priceRange, setPriceRange] = useState<[number, number]>([500, 3000])
  const [amenities, setAmenities] = useState({ petFriendly: false, parking: false, laundry: false, gym: false })
  const [savedIds, setSavedIds] = useState<Set<string>>(loadSavedIds)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [submissionModal, setSubmissionModal] = useState<{ propertyTitle: string } | null>(null)
  const [landlordProperty, setLandlordProperty] = useState('')
  const [landlordFilter, setLandlordFilter] = useState<'all' | 'unlocked' | 'locked' | 'accepted' | 'declined'>('all')
  const [unlockModalMatch, setUnlockModalMatch] = useState<LandlordMatchCard | null>(null)

  const [tenantMatches, setTenantMatches] = useState<MatchCard[]>([])
  const [landlordMatches, setLandlordMatches] = useState<LandlordMatchCard[]>([])
  const [landlordProperties, setLandlordProperties] = useState<Array<{ id: string; label: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const MATCHES_PAGE_SIZE = 6
  const [landlordMatchesShown, setLandlordMatchesShown] = useState(MATCHES_PAGE_SIZE)
  const [tenantMatchesShown, setTenantMatchesShown] = useState(MATCHES_PAGE_SIZE)

  const loadTenantMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('id, title, address_line1, city, state, bedrooms, bathrooms, amenities, monthly_rent_cents')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setTenantMatches(
      (data ?? []).map((p) => {
        const amenityList = Array.isArray(p.amenities) ? p.amenities.map((a) => String(a)) : []
        return {
          id: p.id,
          title: p.title || p.address_line1,
          location: [p.city, p.state].filter(Boolean).join(', '),
          price: `${formatCurrency(p.monthly_rent_cents)}/month`,
          saved: false,
          compatibility: 'Property matched based on your preferences.',
          tags: [formatBedrooms(p.bedrooms), ...amenityList.slice(0, 3)].filter(Boolean),
          bedrooms: Number(p.bedrooms) || 0,
          monthly_rent_cents: Number(p.monthly_rent_cents) || 0,
          amenitiesList: amenityList,
        }
      }),
    )
  }, [])

  const loadAppliedIds = useCallback(async () => {
    if (!user || profileRole !== 'tenant') return
    const { data, error } = await supabase
      .from('applications')
      .select('property_id')
      .eq('tenant_id', user.id)
    if (error) return
    setAppliedIds(new Set((data ?? []).map((r) => r.property_id)))
  }, [user, profileRole])

  const loadLandlordMatches = useCallback(async (propertyIds: string[]) => {
    if (!user || propertyIds.length === 0) {
      setLandlordMatches([])
      return
    }

    const selectColumns =
      'id, status, unlocked_at, created_at, tenant:tenant_id(id, display_name), property:property_id(id, title, address_line1)'

    const result = await supabase
      .from('applications')
      .select(selectColumns)
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false })

    if (result.error) {
      setError(result.error.message)
      return
    }

    const rows = (result.data ?? []) as Array<{
      id: string
      status: string
      unlocked_at?: string | null
      created_at: string
      tenant?: { id?: string; display_name?: string }
      property?: { title?: string; address_line1?: string }
    }>

    setLandlordMatches(
      rows.map((row) => ({
        id: row.id,
        tenantId: row.tenant?.id ?? row.id,
        name: row.tenant?.display_name || 'Tenant',
        appliedAgo: formatRelativeTime(row.created_at),
        status: applicationStatusToMatch(row.status, row.unlocked_at ?? null),
        compatibilitySummary: 'See full profile for details.',
        creditScore: 'See profile',
        tenantScore: 'See profile',
        leaseIntent: 'See profile',
      })),
    )
  }, [user])

  const loadLandlordProperties = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('properties')
      .select('id, title, address_line1')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false })

    const list = (data ?? []).map((p) => ({
      id: p.id,
      label: p.title || p.address_line1,
    }))
    setLandlordProperties(list)
    return list
  }, [user])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    if (roleLoading || profileRole === null) {
      return
    }

    setLoading(true)
    setError(null)

    if (profileRole === 'tenant') {
      Promise.all([loadTenantMatches(), loadAppliedIds()]).finally(() => setLoading(false))
    } else {
      loadLandlordProperties().then((props) => {
        const ids = props?.map((p) => p.id) ?? []
        const targetIds = landlordProperty && ids.includes(landlordProperty)
          ? [landlordProperty]
          : ids
        if (targetIds.length > 0) {
          loadLandlordMatches(targetIds).finally(() => setLoading(false))
        } else {
          setLandlordMatches([])
          setLoading(false)
        }
      }).catch(() => {
        setLandlordMatches([])
        setLoading(false)
      })
    }
  }, [user, roleLoading, profileRole, landlordProperty, loadTenantMatches, loadAppliedIds, loadLandlordMatches, loadLandlordProperties])

  const toggleAmenity = (key: keyof typeof amenities) =>
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveSavedIds(next)
      return next
    })
  }

  const handleApplyNow = async (match: MatchCard) => {
    if (!user) return
    const { error } = await supabase.from('applications').insert({
      tenant_id: user.id,
      property_id: match.id,
      status: 'pending',
      message: null,
    })
    if (error && error.code !== '23505') {
      setError(error.message)
      return
    }
    setAppliedIds((prev) => new Set(prev).add(match.id))
    setSubmissionModal({ propertyTitle: match.title })
  }

  const displayedMatches = activeTab === 'saved'
    ? tenantMatches.filter((m) => savedIds.has(m.id))
    : tenantMatches

  const filteredMatches = useMemo(() => {
    let list = displayedMatches
    if (bedrooms !== 'any') {
      const minBeds = bedrooms === '4+' ? 4 : parseInt(bedrooms, 10)
      list = list.filter((m) => m.bedrooms >= minBeds)
    }
    list = list.filter(
      (m) =>
        m.monthly_rent_cents >= priceRange[0] * 100 &&
        m.monthly_rent_cents <= priceRange[1] * 100,
    )
    if (amenities.petFriendly) list = list.filter((m) => m.amenitiesList.includes('pet_friendly'))
    if (amenities.parking) list = list.filter((m) => m.amenitiesList.includes('parking'))
    if (amenities.laundry) list = list.filter((m) => m.amenitiesList.includes('laundry'))
    if (amenities.gym) list = list.filter((m) => m.amenitiesList.includes('gym'))
    return list
  }, [displayedMatches, bedrooms, priceRange, amenities])

  const hasMatches = filteredMatches.length > 0
  const displayedLandlordMatches =
    landlordFilter === 'all'
      ? landlordMatches
      : landlordMatches.filter((match) => match.status === landlordFilter)

  if (roleLoading || profileRole === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (profileRole === 'landlord') {
    return (
      <>
        <div className="flex min-h-full flex-col px-4 py-4">
          {!landlordSurveyCompletedAt ? (
            <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Ready to find matches?</h2>
              <p className="mt-1 text-sm text-gray-600">You&apos;ll need to finish the next few items to receive matches.</p>
              <ul className="mt-5 space-y-3">
                <li>
                  {displayName ? (
                    <div className="flex cursor-default items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">Create Profile</p>
                        <p className="text-xs text-gray-500">Sub-line for company details</p>
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <Link to="/onboarding/profile" className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">Create Profile</p>
                        <p className="text-xs text-gray-500">Sub-line for company details</p>
                      </div>
                      <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </li>
                <li>
                  <Link to="/onboarding/survey/intro" className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">Finish Landlord Survey</p>
                      <p className="text-xs text-gray-500">Complete your profile for better tenant matching.</p>
                    </div>
                    <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link to="/onboarding/property/intro" className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">Add My First Property</p>
                      <p className="text-xs text-gray-500">Start listing your property to find tenants.</p>
                    </div>
                    <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              </ul>
            </div>
          ) : null}
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[210px]">
                  <select
                    value={landlordProperty}
                    onChange={(event) => setLandlordProperty(event.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
                  >
                    <option value="">All Properties</option>
                    {landlordProperties.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'all', label: 'All' },
                    { value: 'unlocked', label: 'Unlocked' },
                    { value: 'locked', label: 'Locked' },
                    { value: 'accepted', label: 'Accepted' },
                    { value: 'declined', label: 'Declined' },
                  ] as const).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setLandlordFilter(item.value)}
                      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                        landlordFilter === item.value
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${displayedLandlordMatches.length} matches found`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex justify-center py-12">
              <p className="text-sm text-gray-500">Loading matches...</p>
            </div>
          ) : (
          <>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {displayedLandlordMatches.slice(0, landlordMatchesShown).map((match) => (
              <div key={match.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                <Link
                  to={`/matches/tenant/${match.tenantId}${
                    match.status === 'declined'
                      ? '?mode=full&status=declined'
                      : match.status === 'accepted'
                        ? '?mode=full&status=accepted'
                        : match.status === 'locked'
                          ? ''
                          : '?mode=full'
                  }`}
                  className="flex items-start gap-3 rounded-lg hover:opacity-90"
                >
                  <LandlordAvatar name={match.name} />
                  <div>
                    <p className="text-[1.15rem] font-medium text-gray-900">{match.name}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{match.appliedAgo}</p>
                  </div>
                </Link>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      match.status === 'declined'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-gray-500">Compatibility Summary</span>
                    <span className="text-right text-gray-900">{match.compatibilitySummary}</span>
                  </div>
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-gray-500">Credit Score</span>
                    <span className="text-right text-gray-900">{match.creditScore}</span>
                  </div>
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-gray-500">Tenant Score</span>
                    <span className="text-right text-gray-900">{match.tenantScore}</span>
                  </div>
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-gray-500">Lease Intent</span>
                    <span className="text-right text-gray-900">{match.leaseIntent}</span>
                  </div>
                </div>

                <div className="mt-5">
                  {match.status === 'locked' ? (
                    <button
                      type="button"
                      onClick={() => setUnlockModalMatch(match)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zm-7 9h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                      </svg>
                      Unlock Match
                    </button>
                  ) : null}

                  {match.status === 'unlocked' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        to={`/matches/tenant/${match.tenantId}?mode=full`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Decline
                      </Link>
                      <Link
                        to={`/matches/tenant/${match.tenantId}?mode=full`}
                        className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        Accept
                      </Link>
                    </div>
                  ) : null}

                  {match.status === 'accepted' ? (
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l1.385-3.231C3.512 15.477 3 13.79 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Message Tenant
                    </button>
                  ) : null}

                  {match.status === 'declined' ? (
                    <p className="py-2 text-center text-sm text-gray-500">Application declined</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {displayedLandlordMatches.length > landlordMatchesShown ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setLandlordMatchesShown((n) => n + MATCHES_PAGE_SIZE)}
                className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                Load More Matches
              </button>
            </div>
          ) : null}

          </>
          )}

        </div>

        {unlockModalMatch ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
            <div className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h2 className="text-[1.35rem] font-medium text-gray-900">Unlock Tenant Profile</h2>
                <button
                  type="button"
                  onClick={() => setUnlockModalMatch(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close unlock modal"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-5 py-4">
                <div className="text-center">
                  <p className="text-[2.25rem] font-medium leading-none text-gray-900">$9.99</p>
                  <p className="mt-2 text-sm text-gray-500">One-time unlock</p>
                </div>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  Unlock this tenant&apos;s full profile including rental history, personality fit, and contact info.
                </p>

                <ul className="mt-5 space-y-2 text-sm text-gray-600">
                  {[
                    'Complete rental history',
                    'Personality compatibility details',
                    'Direct contact information',
                    'Employment verification',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg className="mt-1 h-4 w-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setUnlockModalMatch(null)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!unlockModalMatch) return
                      setUnlockModalMatch(null)
                      navigate(`/matches/tenant/${unlockModalMatch.tenantId}?mode=full`)
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zm-7 9h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                    </svg>
                    Confirm & Unlock
                  </button>
                </div>

                <p className="mt-4 text-center text-[11px] leading-5 text-gray-400">
                  Your payment is processed through Stripe and is non-refundable once profile is viewed.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <div className="space-y-6">
      {!tenantSurveyCompletedAt ? (
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-900 text-white">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Under 2 min
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">Set your lease preferences</h2>
            <p className="mt-3 max-w-[480px] text-sm leading-7 text-gray-600">
              Share your move date, budget, and preferences so we can match you with the right properties.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-900">Better Matches</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">We&apos;ll show you properties that fit your budget and needs.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-900">Save Time</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">Skip listings that won&apos;t work for your timeline or situation.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-900">Higher Success</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">Increase your chances of finding and securing the right place.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                What we&apos;ll ask
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                {['Lease length and move date', 'Preferred budget range', 'Pets and living situation'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gray-200/80 px-3 py-1.5 text-xs font-medium text-gray-600">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Under 2 min
            </span>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/onboarding/lease-preferences"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Set your preferences
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="mt-3 text-xs text-gray-500">
              Required to view property matches. You can update your preferences anytime from your profile.
            </p>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Preferences required</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Set your lease preferences to view property matches and apply to listings.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {tenantSurveyCompletedAt ? (
      <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Matches</h1>
          <p className="text-gray-600 mt-1">
            Properties matched based on your preferences and compatibility.
          </p>
        </div>
        <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 min-w-[140px]">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm font-medium text-gray-700">Rent Score</span>
            <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Rent Score info">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-[4px] border-emerald-500 text-2xl font-semibold text-gray-800">
              85
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'all'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Matches
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'saved'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Saved Properties
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label htmlFor="bedrooms" className="block text-xs font-medium text-gray-500 mb-1">
            Bedrooms
          </label>
          <select
            id="bedrooms"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="any">Any</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Price Range
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">${priceRange[0]}</span>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-sm text-gray-700">${priceRange[1]}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <span className="text-xs font-medium text-gray-500 self-end mb-1">Amenities</span>
          {[
            { key: 'petFriendly' as const, label: 'Pet Friendly' },
            { key: 'parking' as const, label: 'Parking' },
            { key: 'laundry' as const, label: 'Laundry' },
            { key: 'gym' as const, label: 'Gym' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={amenities[key]}
                onChange={() => toggleAmenity(key)}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {hasMatches ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredMatches.slice(0, tenantMatchesShown).map((match) => {
            const isSaved = savedIds.has(match.id)
            const isApplied = appliedIds.has(match.id)
            return (
              <div
                key={match.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{match.title}</h3>
                    <p className="mt-1 text-[2rem] font-medium leading-none text-gray-900">{match.price}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSaved(match.id)}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                    aria-label={isSaved ? 'Unsave' : 'Save'}
                  >
                    {isSaved ? (
                      <svg className="h-5 w-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21s-6.716-4.535-9.193-8.12C.99 10.257 1.37 6.84 4.127 4.963c2.168-1.476 5.02-1.05 6.873 1.027 1.853-2.076 4.705-2.503 6.873-1.027 2.757 1.877 3.137 5.294 1.32 7.917C18.716 16.465 12 21 12 21z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="mb-4 aspect-[16/7] rounded-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-sm text-gray-500">Property image</span>
                </div>

                <div className="flex-1 flex flex-col">
                  <p className="mb-4 text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">Compatibility:</span>{' '}
                    {match.compatibility}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-4 text-xs text-gray-500">
                    {match.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="mt-auto flex gap-3">
                    {isApplied ? (
                      <span className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-3 text-sm font-medium text-white">
                        Applied
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyNow(match)}
                        className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        Apply Now
                      </button>
                    )}
                    <Link
                      to={`/property/${match.id}?from=matches`}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View Property
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {hasMatches && activeTab === 'all' && filteredMatches.length > tenantMatchesShown ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setTenantMatchesShown((n) => n + MATCHES_PAGE_SIZE)}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Load More Matches
          </button>
        </div>
      ) : null}

      {!hasMatches && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-gray-200">
          <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center mb-6">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          {activeTab === 'saved' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Saved Properties Yet</h2>
              <p className="text-gray-600 text-center max-w-md mb-8">
                Tap the heart on any match to save it here for later.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
              >
                Browse Matches
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Matches Yet</h2>
              <p className="text-gray-600 text-center max-w-md mb-8">
                Adjust your lease preferences or you can complete your application. Once you apply you can submit your application for any property.
              </p>
              <Link
                to="/applications/apply"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
              >
                Complete Application
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          )}
        </div>
      )}

      {submissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-[304px] rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-center text-[2rem] font-medium leading-tight text-gray-900">Application Submitted!</h2>
            <p className="mb-5 text-center text-sm text-gray-600">
              Your application for {submissionModal.propertyTitle} has been successfully submitted to the landlord.
            </p>
            <div className="mb-5 space-y-3">
              <div className="flex gap-2.5">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">What happens next?</h3>
                  <p className="mt-1 text-xs leading-5 text-gray-600">The landlord will review your application and respond within 2-3 business days.</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Stay updated</h3>
                  <p className="mt-1 text-xs leading-5 text-gray-600">We'll notify you via email and in-app notifications when there's an update.</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubmissionModal(null)}
              className="w-full rounded-lg bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
      </>
      ) : null}
    </div>
  )
}
