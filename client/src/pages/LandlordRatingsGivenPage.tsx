import { Link, Navigate } from 'react-router-dom'
import { LandlordRatingsGivenCard } from '../components/LandlordRatingsGivenCard'
import { useAuth } from '../lib/useAuth'
import { useProfileRole } from '../lib/useProfileRole'

export function LandlordRatingsGivenPage() {
  const { user } = useAuth()
  const { role: profileRole, loading: roleLoading } = useProfileRole(user)

  if (roleLoading || profileRole === null) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
        <span className="text-sm text-gray-500">Loading…</span>
      </div>
    )
  }

  if (profileRole !== 'landlord') {
    return <Navigate to="/account" replace />
  }

  return (
    <div className="flex min-h-full flex-col px-4 py-4">
      <Link
        to="/account"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to profile
      </Link>

      <h1 className="text-[1.6rem] font-medium text-gray-900">Ratings you&apos;ve given</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
        Every tenant rating and comment you&apos;ve submitted. Open a tenant to update your review from their
        profile.
      </p>

      <LandlordRatingsGivenCard maxPreviewItems={null} hideHeader className="mt-8" />
    </div>
  )
}
