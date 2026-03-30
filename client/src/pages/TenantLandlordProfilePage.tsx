import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { safeInternalPath } from '../lib/safeInternalPath'
import { supabase } from '../lib/supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function TenantLandlordProfilePage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const returnTo = safeInternalPath(searchParams.get('returnTo')) ?? '/matches'
  const propertyId = searchParams.get('property')

  const [profile, setProfile] = useState<{
    display_name: string | null
    avatar_url: string | null
    phone: string | null
    bio: string | null
    city: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id || !UUID_RE.test(id)) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, phone, bio, city')
        .eq('id', id)
        .maybeSingle()

      if (cancelled) return
      if (error || !data) {
        setNotFound(true)
        setProfile(null)
      } else {
        setProfile(data)
        setNotFound(false)
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center px-4">
        <span className="text-sm text-gray-500">Loading…</span>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
        <Link
          to={returnTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 className="text-xl font-medium text-gray-900">Landlord profile</h1>
        <p className="text-sm text-gray-600">This profile isn’t available or couldn’t be loaded.</p>
      </div>
    )
  }

  const name = profile.display_name?.trim() || 'Landlord'

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <Link
        to={returnTo}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to matches
      </Link>

      <div>
        <h1 className="text-[2rem] font-medium text-gray-900">Landlord</h1>
        <p className="mt-1 text-sm text-gray-600">How this host appears on RentalCity.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-600">
            {profile.avatar_url?.trim() ? (
              <img src={profile.avatar_url.trim()} alt={name} className="h-16 w-16 object-cover" />
            ) : (
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
            <p className="mt-1 text-sm text-gray-500">Property manager</p>
            {profile.city?.trim() ? <p className="mt-2 text-sm text-gray-600">{profile.city.trim()}</p> : null}
            {profile.phone?.trim() ? <p className="mt-2 text-sm text-gray-600">{profile.phone.trim()}</p> : null}
          </div>
        </div>
        {profile.bio?.trim() ? (
          <p className="mt-6 border-t border-gray-100 pt-6 text-sm leading-7 text-gray-700">{profile.bio.trim()}</p>
        ) : null}
      </div>

      {propertyId && UUID_RE.test(propertyId) ? (
        <Link
          to={`/property/${encodeURIComponent(propertyId)}?from=matches`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-2 hover:text-gray-950"
        >
          View listing
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : null}
    </div>
  )
}
