import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

type LockedSection = {
  title: string
  rows: {
    label: string
    value?: string
    blurred?: boolean
  }[]
}

type FullSection = {
  title: string
  layout?: 'two-column' | 'single'
  items?: {
    label: string
    value: string
    valueTone?: 'default' | 'muted' | 'large'
    badge?: string
  }[]
}

const TENANT_PROFILES = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    subtitle: 'Professional, 28 years old',
    tenantScore: 85,
    tags: ['Non-smoker', 'Pet-friendly', 'Clean & Organized'],
    creditScoreRange: '700-750',
    creditScoreLabel: 'Good',
    monthlyIncome: '$3,200',
    about:
      "I'm a marketing professional who values a clean, quiet living environment. I work primarily from home and appreciate spaces that promote productivity and relaxation. I'm responsible with my living space and believe in maintaining open communication with landlords. In my free time, I enjoy reading, cooking, and having friends over for dinner parties. I'm looking for a long-term rental where I can settle in and truly make it feel like home.",
    leasePreferences: [
      { label: 'Duration', value: '12+ months' },
      { label: 'Move-in', value: 'Within 30 days' },
      { label: 'Budget', value: '$2,000 - $2,500' },
      { label: 'Pets', value: 'Small Dog' },
    ],
    personalityRatings: [
      { label: 'Cleanliness', rating: 5 },
      { label: 'Communication', rating: 5 },
      { label: 'Responsibility', rating: 5 },
    ],
    highlights: ['Quiet', 'Organized', 'Professional', 'Respectful'],
    verification: ['Income Verification', 'Background Check'],
    rentalHistory: [
      {
        title: 'Downtown Apartment Complex',
        subtitle: '2022 - 2025 • $1,800/month',
        description: 'Clean tenant, always paid on time. No damages reported.',
        badge: 'Excellent',
      },
      {
        title: 'Riverside Condos',
        subtitle: '2020 - 2022 • $1,500/month',
        description: 'Reliable tenant, maintained property well.',
        badge: 'Good',
      },
    ],
    employment: [
      {
        title: 'Senior Marketing Manager',
        subtitle: 'TechStart Inc. • 2023 - Present',
        description: '$75,000/year • Full-time',
      },
      {
        title: 'Marketing Specialist',
        subtitle: 'Digital Solutions • 2021 - 2023',
        description: '$62,000/year • Full-time',
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Michael Reed',
    subtitle: 'Designer, 31 years old',
    tenantScore: 85,
    tags: ['Quiet', 'No pets', 'Remote worker'],
    creditScoreRange: '680-749',
    creditScoreLabel: 'Good',
    monthlyIncome: '$4,100',
    about:
      'I am a product designer who works a hybrid schedule and values calm, well-maintained spaces. I keep a consistent routine, communicate clearly, and am looking for a comfortable home close to transit and local amenities.',
    leasePreferences: [
      { label: 'Duration', value: '6-12 months' },
      { label: 'Move-in', value: '2 weeks' },
      { label: 'Budget', value: '$2,400 - $2,900' },
      { label: 'Pets', value: 'None' },
    ],
    personalityRatings: [
      { label: 'Cleanliness', rating: 4 },
      { label: 'Communication', rating: 4 },
      { label: 'Responsibility', rating: 5 },
    ],
    highlights: ['Quiet', 'Reliable', 'Designer', 'Respectful'],
    verification: ['Income Verification', 'Background Check'],
    rentalHistory: [
      {
        title: 'Harbor View Lofts',
        subtitle: '2021 - 2024 • $2,100/month',
        description: 'Timely rent payments and strong landlord communication.',
        badge: 'Good',
      },
    ],
    employment: [
      {
        title: 'Product Designer',
        subtitle: 'North Studio • 2022 - Present',
        description: '$88,000/year • Full-time',
      },
    ],
  },
  '3': {
    id: '3',
    name: 'Emily Kim',
    subtitle: 'Consultant, 29 years old',
    tenantScore: 90,
    tags: ['Professional', 'Organized', 'Long-term'],
    creditScoreRange: '750+',
    creditScoreLabel: 'Excellent',
    monthlyIncome: '$5,400',
    about:
      'I am a management consultant seeking a long-term rental with strong natural light and a peaceful atmosphere. I travel occasionally for work, keep my home tidy, and value respectful communication.',
    leasePreferences: [
      { label: 'Duration', value: '24+ months' },
      { label: 'Move-in', value: '45 days' },
      { label: 'Budget', value: '$2,800 - $3,400' },
      { label: 'Pets', value: 'None' },
    ],
    personalityRatings: [
      { label: 'Cleanliness', rating: 5 },
      { label: 'Communication', rating: 4 },
      { label: 'Responsibility', rating: 5 },
    ],
    highlights: ['Organized', 'Professional', 'Quiet', 'Responsible'],
    verification: ['Income Verification', 'Background Check'],
    rentalHistory: [
      {
        title: 'City Park Residences',
        subtitle: '2021 - 2024 • $2,350/month',
        description: 'Excellent tenant with no complaints or late payments.',
        badge: 'Excellent',
      },
    ],
    employment: [
      {
        title: 'Management Consultant',
        subtitle: 'West Advisory • 2021 - Present',
        description: '$102,000/year • Full-time',
      },
    ],
  },
  '4': {
    id: '4',
    name: 'David Lee',
    subtitle: 'Engineer, 34 years old',
    tenantScore: 93,
    tags: ['Pet owner', 'Stable income', 'Long-term'],
    creditScoreRange: '680-749',
    creditScoreLabel: 'Good',
    monthlyIncome: '$6,000',
    about:
      'I am an engineer looking for a long-term rental that works well for me and my dog. I am consistent, respectful, and prioritize maintaining the home I live in.',
    leasePreferences: [
      { label: 'Duration', value: '12+ months' },
      { label: 'Move-in', value: '1 month' },
      { label: 'Budget', value: '$2,500 - $3,100' },
      { label: 'Pets', value: 'Dog' },
    ],
    personalityRatings: [
      { label: 'Cleanliness', rating: 4 },
      { label: 'Communication', rating: 4 },
      { label: 'Responsibility', rating: 5 },
    ],
    highlights: ['Pet-friendly', 'Responsible', 'Engineer', 'Stable'],
    verification: ['Income Verification', 'Background Check'],
    rentalHistory: [
      {
        title: 'Oak Terrace',
        subtitle: '2020 - 2024 • $2,250/month',
        description: 'Responsible tenant and strong upkeep of property.',
        badge: 'Good',
      },
    ],
    employment: [
      {
        title: 'Senior Software Engineer',
        subtitle: 'CloudForge • 2020 - Present',
        description: '$118,000/year • Full-time',
      },
    ],
  },
} as const

const lockedSections: LockedSection[] = [
  {
    title: 'Personality Snapshot',
    rows: [
      { label: 'Communication Style', blurred: true },
      { label: 'Lifestyle', blurred: true },
      { label: 'Cleanliness', blurred: true },
      { label: 'Social Preferences', blurred: true },
    ],
  },
  {
    title: 'Financial Information',
    rows: [
      { label: 'Credit Score Range', value: '', blurred: false },
      { label: 'Monthly Income', blurred: true },
    ],
  },
  {
    title: 'Lease Preferences',
    rows: [
      { label: 'Preferred Lease Duration', value: '12-18 months', blurred: false },
      { label: 'Move-in Timeline', blurred: true },
      { label: 'Pets', blurred: true },
    ],
  },
  {
    title: 'Employment & References',
    rows: [
      { label: 'Current Employment', blurred: true },
      { label: 'Previous Landlord Reference', blurred: true },
      { label: 'Rental History', blurred: true },
    ],
  },
]

function PlaceholderBar({ width = 'w-28' }: { width?: string }) {
  return <span className={`inline-block h-3 rounded bg-gray-100 ${width}`} />
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-5 rounded-2xl border border-gray-200 bg-white px-5 py-5">
      <h2 className="text-[1.35rem] font-medium text-gray-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          className={`h-4 w-4 ${index < value ? 'text-gray-500' : 'text-gray-200'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.036 3.19a1 1 0 00.95.69h3.354c.969 0 1.371 1.24.588 1.81l-2.714 1.972a1 1 0 00-.364 1.118l1.036 3.19c.3.921-.755 1.688-1.539 1.118l-2.714-1.972a1 1 0 00-1.176 0l-2.714 1.972c-.783.57-1.838-.197-1.539-1.118l1.036-3.19a1 1 0 00-.364-1.118L2.17 8.617c-.783-.57-.38-1.81.588-1.81h3.354a1 1 0 00.95-.69l1.036-3.19z" />
        </svg>
      ))}
    </div>
  )
}

export function LandlordTenantProfilePage() {
  const { user } = useAuth()
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [remoteTenantName, setRemoteTenantName] = useState<string | null>(null)
  const [appliedPropertyLabel, setAppliedPropertyLabel] = useState('Modern Downtown Apartment')
  const [appliedPropertyMeta, setAppliedPropertyMeta] = useState('123 Main Street, Unit 4B • $2,200/month')
  const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null)
  const [rejectedApplicationId, setRejectedApplicationId] = useState<string | null>(null)
  const [applicationPropertyId, setApplicationPropertyId] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [declineError, setDeclineError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [loadedApplicationStatus, setLoadedApplicationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const tenant = {
    ...(TENANT_PROFILES[id as keyof typeof TENANT_PROFILES] ?? TENANT_PROFILES['1']),
    id,
    name: remoteTenantName || (TENANT_PROFILES[id as keyof typeof TENANT_PROFILES] ?? TENANT_PROFILES['1']).name,
  }
  const mode = searchParams.get('mode')
  const status = searchParams.get('status')
  const isUnlocked =
    mode === 'full' ||
    status === 'declined' ||
    loadedApplicationStatus === 'rejected' ||
    loadedApplicationStatus === 'approved'
  const isAccepted = status === 'accepted' || loadedApplicationStatus === 'approved'
  const isDeclined = status === 'declined' || loadedApplicationStatus === 'rejected'

  useEffect(() => {
    async function loadTenantContext() {
      if (!user || !id) return

      const [{ data: profileData }, { data: applicationsData }] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('id', id).maybeSingle(),
        supabase
          .from('applications')
          .select(
            'id, status, property_id, property:property_id(landlord_id, title, address_line1, city, state, monthly_rent_cents)',
          )
          .eq('tenant_id', id)
          .in('status', ['pending', 'approved', 'rejected'])
          .order('status', { ascending: true }),
      ])

      if (profileData?.display_name) {
        setRemoteTenantName(profileData.display_name)
      }

      type AppRow = {
        id: string
        status: string
        property_id: string
        property: { landlord_id: string; title: string | null; address_line1: string; city: string; state: string | null; monthly_rent_cents: number | null } | null
      }

      const rows = (applicationsData ?? []) as AppRow[]
      const forLandlord = rows.filter((r) => r.property?.landlord_id === user.id)
      const pending = forLandlord.find((r) => r.status === 'pending')
      const rejected = forLandlord.find((r) => r.status === 'rejected')
      const approved = forLandlord.find((r) => r.status === 'approved')
      const display = pending ?? approved ?? rejected

      if (display) {
        setLoadedApplicationStatus(display.status as 'pending' | 'approved' | 'rejected')
      } else {
        setLoadedApplicationStatus(null)
      }

      if (pending) {
        setPendingApplicationId(pending.id)
        setRejectedApplicationId(null)
        setApplicationPropertyId(pending.property_id)
      } else {
        setPendingApplicationId(null)
        setRejectedApplicationId(rejected?.id ?? null)
        setApplicationPropertyId(rejected?.property_id ?? display?.property_id ?? null)
      }

      if (display?.property) {
        const p = display.property
        setAppliedPropertyLabel(p.title || p.address_line1)
        setAppliedPropertyMeta(
          [
            [p.address_line1, p.city, p.state].filter(Boolean).join(', '),
            p.monthly_rent_cents != null
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(p.monthly_rent_cents / 100) + '/month'
              : null,
          ]
            .filter(Boolean)
            .join(' • '),
        )
      }
    }

    loadTenantContext()
  }, [id, user])

  async function handleAccept() {
    if (!pendingApplicationId || !applicationPropertyId || !user) return
    setAcceptError(null)
    setAccepting(true)
    try {
      const { error: updateErr } = await supabase
        .from('applications')
        .update({ status: 'approved' })
        .eq('id', pendingApplicationId)

      if (updateErr) throw updateErr

      const { data: existing } = await supabase
        .from('message_threads')
        .select('id')
        .eq('tenant_id', id)
        .eq('landlord_id', user.id)
        .eq('property_id', applicationPropertyId)
        .maybeSingle()

      if (!existing) {
        const { error: insertErr } = await supabase.from('message_threads').insert({
          application_id: pendingApplicationId,
          tenant_id: id,
          landlord_id: user.id,
          property_id: applicationPropertyId,
        })
        if (insertErr) throw insertErr
      }

      setPendingApplicationId(null)
      setAcceptModalOpen(true)
    } catch (e) {
      setAcceptError(e instanceof Error ? e.message : 'Failed to accept tenant')
    } finally {
      setAccepting(false)
    }
  }

  async function handleDecline() {
    if (!pendingApplicationId || !user) return
    setDeclineError(null)
    setDeclining(true)
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', pendingApplicationId)

      if (error) throw error

      setRejectedApplicationId(pendingApplicationId)
      setPendingApplicationId(null)
      setDeclineModalOpen(false)
      navigate(`/matches/tenant/${tenant.id}?mode=full&status=declined`)
    } catch (e) {
      setDeclineError(e instanceof Error ? e.message : 'Failed to decline tenant')
    } finally {
      setDeclining(false)
    }
  }

  function handleAcceptModalGotIt() {
    setAcceptModalOpen(false)
    navigate(`/matches/tenant/${tenant.id}?mode=full&status=accepted`)
  }

  async function handleUndoDecline() {
    if (!rejectedApplicationId || !user) return
    setDeclineError(null)
    setDeclining(true)
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'pending' })
        .eq('id', rejectedApplicationId)

      if (error) throw error

      setRejectedApplicationId(null)
      setPendingApplicationId(rejectedApplicationId)
      navigate(`/matches/tenant/${tenant.id}?mode=full`)
    } catch (e) {
      setDeclineError(e instanceof Error ? e.message : 'Failed to undo decline')
    } finally {
      setDeclining(false)
    }
  }

  async function handleRemoveFromMatches() {
    if (!rejectedApplicationId || !user) return
    setDeclineError(null)
    setRemoving(true)
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('id', rejectedApplicationId)

      if (error) throw error

      navigate('/matches', { replace: true })
    } catch (e) {
      setDeclineError(e instanceof Error ? e.message : 'Failed to remove from matches')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col px-4 py-4">
      <div className="w-full">
        <Link
          to="/matches"
          className="mb-7 inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <div>
                <h1 className="text-[1.6rem] font-medium text-gray-900">{tenant.name}</h1>
                <p className="mt-1 text-sm text-gray-600">{tenant.subtitle}</p>
                {isUnlocked ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tenant.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {isAccepted ? (
                  <div className="mt-3">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      Accepted
                    </span>
                  </div>
                ) : null}
                {isDeclined ? (
                  <div className="mt-3">
                    <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                      Declined
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="min-w-[112px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <span>Tenant Score</span>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-emerald-400 text-xl font-medium text-gray-900">
                {tenant.tenantScore}
              </div>
            </div>
          </div>
        </section>

        {isUnlocked ? (
          <>
            {isAccepted || isDeclined ? (
              <>
                <section className="mt-5 rounded-2xl border border-gray-200 bg-white px-5 py-5">
                  <p className="text-sm text-gray-500">Applied for</p>
                  <div className="mt-4 flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[1.15rem] font-medium text-gray-900">{appliedPropertyLabel}</p>
                      <p className="mt-1 text-sm text-gray-500">{appliedPropertyMeta}</p>
                    </div>
                  </div>
                </section>

                <div className="mt-5 flex items-center justify-center gap-3">
                  {isAccepted ? (
                    <>
                      <Link
                        to="/messages"
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l1.385-3.231C3.512 15.477 3 13.79 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Go to Inbox
                      </Link>

                      <Link
                        to="/matches"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10M7 17h10M4 7h.01M4 12h.01M4 17h.01" />
                        </svg>
                        View All Matches
                      </Link>
                    </>
                  ) : null}

                  {isDeclined ? (
                    <>
                      <button
                        type="button"
                        onClick={handleUndoDecline}
                        disabled={!rejectedApplicationId || declining}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                      >
                        {declining ? 'Undoing…' : 'Undo decline'}
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveFromMatches}
                        disabled={!rejectedApplicationId || removing}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {removing ? 'Removing…' : 'Remove from matches'}
                      </button>
                    </>
                  ) : null}
                </div>
              </>
            ) : null}

            <SectionCard title="About Me">
              <p className="text-sm leading-8 text-gray-700">{tenant.about}</p>
            </SectionCard>

            <SectionCard title="Financial Information">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Credit Score Range</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[2rem] font-medium leading-none text-gray-900">{tenant.creditScoreRange}</span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                      {tenant.creditScoreLabel}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Monthly Income</p>
                  <p className="mt-2 text-[2rem] font-medium leading-none text-gray-900">{tenant.monthlyIncome}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Lease Preferences">
              <div className="space-y-3">
                {tenant.leasePreferences.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-6 text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="text-right text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Personality">
              <div className="space-y-3">
                {tenant.personalityRatings.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-6 text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <RatingStars value={item.rating} />
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-sm text-gray-500">Highlights</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tenant.highlights.map((item) => (
                    <span key={item} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Verification">
              <div className="space-y-4">
                {tenant.verification.map((item) => (
                  <div key={item} className="flex items-center justify-between gap-6">
                    <span className="text-sm text-gray-700">{item}</span>
                    <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Rental History">
              <div className="space-y-6">
                {tenant.rentalHistory.map((item) => (
                  <div key={item.title} className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-[1.15rem] font-medium text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{item.subtitle}</p>
                      <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Employment">
              <div className="space-y-6">
                {tenant.employment.map((item) => (
                  <div key={item.title} className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-[1.15rem] font-medium text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{item.subtitle}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                    </div>
                    <svg className="mt-1 h-5 w-5 flex-shrink-0 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </SectionCard>

            {!isAccepted && !isDeclined && pendingApplicationId ? (
              <div className="mt-5 space-y-3">
                {acceptError ? (
                  <p className="text-sm text-red-600">{acceptError}</p>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setDeclineModalOpen(true)}
                  disabled={declining}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Decline Tenant
                </button>

                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={accepting}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {accepting ? (
                    'Accepting…'
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accept Tenant
                    </>
                  )}
                </button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <section className="mt-5 rounded-2xl border border-gray-200 bg-white px-6 py-5 text-center">
              <h2 className="text-[1.35rem] font-medium text-gray-900">Unlock Full Tenant Profile</h2>
              <p className="mx-auto mt-3 max-w-[360px] text-sm leading-6 text-gray-600">
                Get access to complete tenant details, contact information, and application documents.
              </p>

              <Link
                to={`/matches/tenant/${tenant.id}?mode=full`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zm-7 9h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                </svg>
                Unlock for $9.99
              </Link>

              <p className="mt-3 text-xs text-gray-400">One-time payment • Secure checkout via Stripe</p>
            </section>

            {lockedSections.map((section) => (
              <section key={section.title} className="relative mt-5 rounded-2xl border border-gray-200 bg-white px-5 py-5">
                <h2 className="text-[1.35rem] font-medium text-gray-200">{section.title}</h2>

                <div
                  className={`mt-5 grid gap-x-8 gap-y-4 ${
                    section.rows.length === 2 ? 'sm:grid-cols-2' : section.rows.length === 4 ? 'sm:grid-cols-2' : ''
                  }`}
                >
                  {section.rows.map((row) => (
                    <div key={row.label} className="relative">
                      <p className="text-sm text-gray-200">{row.label}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {row.blurred ? (
                          <PlaceholderBar width={section.title === 'Lease Preferences' ? 'w-20' : 'w-24'} />
                        ) : (
                          <>
                            <span className="text-[2rem] font-medium leading-none text-gray-300">
                              {row.label === 'Credit Score Range' ? tenant.creditScoreRange : row.value}
                            </span>
                            {row.label === 'Credit Score Range' ? (
                              <span className="text-xs text-gray-300">{tenant.creditScoreLabel}</span>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zm-7 9h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </section>
            ))}
          </>
        )}
      </div>


      {isUnlocked && !isAccepted && acceptModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
          <div className="w-full max-w-[680px] rounded-[28px] bg-white px-8 py-7 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-white">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="mt-5 text-center text-[2rem] font-medium text-gray-900">Tenant Accepted!</h2>
            <p className="mx-auto mt-3 max-w-[440px] text-center text-sm leading-7 text-gray-600">
              You&apos;ve accepted this tenant. They&apos;ll be added to your inbox so you can start a
              conversation.
            </p>
            <section className="mt-6 rounded-2xl border border-gray-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[1.35rem] font-medium text-gray-900">{tenant.name}</h3>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        Accepted
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{tenant.subtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tenant.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="min-w-[112px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <span>Tenant Score</span>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-emerald-400 text-xl font-medium text-gray-900">
                    {tenant.tenantScore}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-gray-200 bg-white px-5 py-5">
              <p className="text-sm text-gray-500">Applied for</p>
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                      <p className="text-[1.15rem] font-medium text-gray-900">{appliedPropertyLabel}</p>
                      <p className="mt-1 text-sm text-gray-500">{appliedPropertyMeta}</p>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-2xl bg-gray-50 px-5 py-5">
              <h3 className="text-[1.35rem] font-medium text-gray-900">What happens next?</h3>
              <div className="mt-5 space-y-5">
                {[
                  {
                    title: 'Sarah will be notified of your acceptance',
                    description: "They'll receive an email and in-app notification",
                  },
                  {
                    title: 'Start a conversation in your inbox',
                    description: 'Discuss next steps, schedule viewings, and finalize details',
                  },
                  {
                    title: 'Complete the rental agreement',
                    description: 'Use our secure platform or your preferred method',
                  },
                ].map((step, index) => (
                  <div key={step.title} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        index < 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-10 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={handleAcceptModalGotIt}
                className="rounded-lg bg-gray-900 px-10 py-3 text-sm font-medium text-white hover:bg-gray-800"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isUnlocked && !isAccepted && !isDeclined && declineModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
          <div className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-[1.35rem] font-medium text-gray-900">Decline Tenant</h2>
            </div>

            <div className="px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                </div>

                <div>
                  <p className="text-[1.15rem] font-medium text-gray-900">
                    Are you sure you want to decline this tenant?
                  </p>
                  <p className="mt-4 text-sm leading-7 text-gray-600">
                    This action can be undone later but this action will trigger a notification of
                    your decision.
                  </p>
                </div>
              </div>
              {declineError ? (
                <p className="mt-3 text-sm text-red-600">{declineError}</p>
              ) : null}

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeclineModalOpen(false)}
                  disabled={declining}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={declining}
                  className="rounded-lg bg-gray-600 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60"
                >
                  {declining ? 'Declining…' : 'Yes, Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
