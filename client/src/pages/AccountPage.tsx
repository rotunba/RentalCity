import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { useProfileRole } from '../lib/useProfileRole'
import { supabase } from '../lib/supabase'

type ProfileRecord = {
  display_name: string | null
  avatar_url: string | null
  phone: string | null
} | null

type AppliedProperty = {
  id: string
  name: string
  landlord: string
  appliedDate: string
  status: string
}

function formatStatus(dbStatus: string): string {
  const map: Record<string, string> = {
    approved: 'Accepted',
    rejected: 'Declined',
    pending: 'Pending',
    withdrawn: 'Withdrawn',
  }
  return map[dbStatus?.toLowerCase()] ?? dbStatus ?? 'Pending'
}

function formatAppliedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const verificationItems = [
  { label: 'Email Verified', complete: true },
  { label: 'Phone Verified', complete: true },
  { label: 'Income Verified', complete: true },
  { label: 'Background Check', complete: false },
]

type LandlordPropertyCard = {
  id: string
  title: string
  address: string
  details: string
  price: string
}

function Card({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      {title ? <h2 className="mb-4 text-sm font-medium text-gray-900">{title}</h2> : null}
      {children}
    </section>
  )
}

function AvatarPlaceholder({ initials }: { initials: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span className="sr-only">{initials}</span>
    </div>
  )
}

export function AccountPage() {
  const { user } = useAuth()
  const { role: profileRole, loading: roleLoading } = useProfileRole(user)
  const [profile, setProfile] = useState<ProfileRecord>(null)
  const [landlordProperties, setLandlordProperties] = useState<LandlordPropertyCard[]>([])
  const [acceptedTenantCount, setAcceptedTenantCount] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false)
  const [appliedProperties, setAppliedProperties] = useState<AppliedProperty[]>([])

  useEffect(() => {
    async function loadProfile() {
      if (!user || profileRole === null) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, phone')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(profileData)

      if (profileRole === 'landlord') {
        const [{ data: propertiesData }, { data: applicationsData }, { data: ratingsData }] =
          await Promise.all([
            supabase
              .from('properties')
              .select('id, title, address_line1, city, state, bedrooms, bathrooms, monthly_rent_cents')
              .eq('landlord_id', user.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('applications')
              .select('id')
              .eq('status', 'approved'),
            supabase
              .from('tenant_ratings')
              .select('id')
              .eq('landlord_id', user.id),
          ])

        setLandlordProperties(
          (propertiesData ?? []).map((property) => ({
            id: property.id,
            title: property.title || property.address_line1,
            address: [property.address_line1, property.city, property.state].filter(Boolean).join(', '),
            details: `${property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} Bed`} • ${property.bathrooms} Bath`,
            price: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format((property.monthly_rent_cents ?? 0) / 100) + '/month',
          })),
        )
        setAcceptedTenantCount((applicationsData ?? []).length)
        setRatingCount((ratingsData ?? []).length)
      } else {
        const { data: appsData } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            created_at,
            property:property_id(title, address_line1, landlord:profiles(display_name))
          `)
          .eq('tenant_id', user.id)
          .order('created_at', { ascending: false })

        const rows = (appsData ?? []) as Array<{
          id: string
          status: string
          created_at: string
          property?: {
            title?: string
            address_line1?: string
            landlord?: { display_name?: string } | null
          }
        }>

        setAppliedProperties(
          rows.map((row) => ({
            id: row.id,
            name: row.property?.title || row.property?.address_line1 || 'Property',
            landlord: row.property?.landlord?.display_name ?? 'Landlord',
            appliedDate: formatAppliedDate(row.created_at),
            status: formatStatus(row.status),
          })),
        )
      }
    }

    loadProfile()
  }, [user, profileRole])

  if (roleLoading || profileRole === null) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  const fullName = profile?.display_name || 'Sarah Johnson'
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SJ'

  if (profileRole === 'landlord') {
    return (
      <div className="space-y-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-[2rem] font-medium text-gray-900">My Profile</h1>
          <Link
            to="/account/edit"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.586-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.414-8.586z" />
            </svg>
            Edit Profile
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-5">
            <Card>
              <div className="flex items-start gap-4">
                {profile?.avatar_url ? (
                  <button
                    type="button"
                    onClick={() => setPhotoPreviewOpen(true)}
                    className="h-14 w-14 overflow-hidden rounded-full bg-gray-100 text-gray-400 hover:ring-2 hover:ring-gray-300"
                    aria-label="View profile photo"
                  >
                    <img
                      src={profile.avatar_url}
                      alt={fullName}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  <AvatarPlaceholder initials={initials} />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-[1.9rem] font-medium text-gray-900">{fullName}</h2>
                  <p className="mt-1 text-sm text-gray-600">Landlord since 2019</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      San Francisco, CA
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                      </svg>
                      Joined March 2019
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Business Information">
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Business Name</p>
                  <p className="mt-1 text-sm text-gray-900">Johnson Property Management LLC</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Type</p>
                  <p className="mt-1 text-sm text-gray-900">Limited Liability Company</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">Business Address</p>
                  <p className="mt-1 text-sm text-gray-900">1234 Market Street, Suite 500, San Francisco, CA 94102</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Phone</p>
                  <p className="mt-1 text-sm text-gray-900">(415) 555-0123</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Email</p>
                  <p className="mt-1 text-sm text-gray-900">info@johnsonproperties.com</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-500">Website</p>
                  <p className="mt-1 text-sm text-gray-900">www.johnsonproperties.com</p>
                </div>
              </div>
            </Card>

            <Card title="Contact Information">
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Personal Phone</p>
                  <p className="mt-1 text-sm text-gray-900">(415) 555-0198</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Personal Email</p>
                  <p className="mt-1 text-sm text-gray-900">sarah.johnson@email.com</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Preferred Contact Method</p>
                  <p className="mt-1 text-sm text-gray-900">Email</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Emergency Contact</p>
                  <p className="mt-1 text-sm text-gray-900">Michael Johnson - (415) 555-0199</p>
                </div>
              </div>
            </Card>

            <Card title="About Me">
              <p className="max-w-3xl text-sm leading-8 text-gray-700">
                I&apos;m a professional property manager with over 6 years of experience in the San Francisco rental market. I believe in creating positive, long-term relationships with my tenants and maintaining high-quality living spaces. I&apos;m responsive to maintenance requests and always available for any questions or concerns.
              </p>
            </Card>

            <Link
              to="/account/tenants"
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-5 transition-colors hover:bg-gray-50"
            >
              <span className="text-[1.35rem] font-medium text-gray-900">
                Accepted Tenants ({acceptedTenantCount})
              </span>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Card title="Match-Enabled Properties">
              <div className="space-y-3">
                {landlordProperties.length === 0 ? (
                  <p className="text-sm text-gray-500">No properties published yet.</p>
                ) : null}
                {landlordProperties.map((property) => (
                  <div key={property.id} className="flex items-center gap-4 rounded-lg border border-gray-200 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{property.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{property.address}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>{property.details}</span>
                        <span>{property.price}</span>
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      Photo
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="Tenant Ratings">
              <div className="text-center">
                <p className="text-[2.2rem] font-medium text-gray-900">{ratingCount}</p>
                <p className="mt-2 text-sm text-gray-500">Total Ratings Given</p>
                <p className="mt-2 text-xs text-gray-400">Ratings are private and not shown publicly</p>
              </div>
            </Card>

            <Card title="Profile Stats">
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Properties Listed</span>
                  <span className="text-gray-900">{landlordProperties.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Active Matches</span>
                  <span className="text-gray-900">{acceptedTenantCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Successful Rentals</span>
                  <span className="text-gray-900">{acceptedTenantCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Response Rate</span>
                  <span className="text-gray-900">N/A</span>
                </div>
              </div>
            </Card>

            <Card title="Profile Completion">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Profile Completion</span>
                <span className="text-gray-900">95%</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-gray-200">
                <div className="h-2 w-[95%] rounded-full bg-gray-900" />
              </div>
              <p className="mt-4 text-xs text-gray-400">Complete your website URL to reach 100%</p>
            </Card>
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-[2rem] font-medium text-gray-900">My Profile</h1>
        <Link
          to="/account/edit"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.586-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.414-8.586z" />
          </svg>
          Edit Profile
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={fullName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <AvatarPlaceholder initials={initials} />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-[1.75rem] font-medium text-gray-900">{fullName}</h2>
                <p className="mt-1 text-sm text-gray-600">Marketing Professional | Pet Lover</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    San Francisco, CA
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                    </svg>
                    Member since 2024
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-medium text-gray-900">About Me</h3>
              <p className="mt-3 max-w-2xl text-sm leading-8 text-gray-700">
                I&apos;m a marketing professional looking for a quiet, pet-friendly place to call
                home. I work remotely most days and enjoy cooking, reading, and spending time with
                my cat, Luna. I&apos;m a responsible tenant who values cleanliness and maintaining
                good relationships with landlords and neighbors.
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Lease Preferences</h3>
              <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Lease Duration</p>
                    <p className="text-sm text-gray-900">12-24 months</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Move-in Date</p>
                    <p className="text-sm text-gray-900">March 2025</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Budget Range</p>
                    <p className="text-sm text-gray-900">$2,500 - $3,500/month</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11c-2.5 0-4 1.5-4 3.5S6.5 18 9 18h6c2.5 0 4-1.5 4-3.5S17.5 11 15 11c-.7 0-1.3.1-1.9.4A3.5 3.5 0 006 11.5M7.5 8.5h.01M11 6h.01M14.5 8.5h.01M17 6h.01" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Pets</p>
                    <p className="text-sm text-gray-900">1 Cat</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Applied Properties">
            <div className="space-y-3">
              {appliedProperties.length === 0 ? (
                <p className="py-4 text-sm text-gray-500">No applications yet.</p>
              ) : (
                appliedProperties.map((property) => (
                  <Link
                    key={property.id}
                    to={`/account/application/${property.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{property.name}</p>
                      <p className="mt-1 text-sm text-gray-600">Landlord: {property.landlord}</p>
                      <p className="mt-1 text-sm text-gray-500">Applied: {property.appliedDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {property.status}
                      </span>
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Application Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Current Status</span>
                <span className="text-gray-900">Active</span>
              </div>
              <div className="text-sm text-gray-500">
                Valid until: <span className="text-gray-700">July 15, 2025</span>
              </div>
              <div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-[68%] rounded-full bg-gray-500" />
                </div>
                <p className="mt-1 text-xs text-gray-500">4 months remaining</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Application
              </button>
            </div>
          </Card>

          <Card title="Profile Stats">
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Profile Views</span>
                <span className="text-gray-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Applications Sent</span>
                <span className="text-gray-900">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Response Rate</span>
                <span className="text-gray-900">75%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Saved Properties</span>
                <span className="text-gray-900">12</span>
              </div>
            </div>
          </Card>

          <Card title="Verification Status">
            <div className="space-y-3">
              {verificationItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 text-sm">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full ${item.complete ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {item.complete ? (
                      <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                  <span className={item.complete ? 'text-gray-700' : 'text-gray-500'}>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {photoPreviewOpen && profile?.avatar_url && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPhotoPreviewOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPhotoPreviewOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-600 hover:bg-white"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={profile.avatar_url}
              alt={fullName}
              className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>

    </div>
  )
}
