import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatBedrooms, formatBathrooms } from '../lib/propertyDraft'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

type ApplicationRow = {
  id: string
  propertyTitle: string
  propertyMeta: string
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

export function ApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadApplications() {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          property:property_id(id, address_line1, title, bedrooms, bathrooms, sqft, landlord:profiles!landlord_id(display_name))
        `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })

      setLoading(false)

      if (err) {
        setError(err.message)
        return
      }

      const rows = (data ?? []) as Array<{
        id: string
        status: string
        created_at: string
        property?: {
          id?: string
          address_line1?: string
          title?: string
          bedrooms?: number
          bathrooms?: number | string
          sqft?: number
          landlord?: { display_name?: string } | null
        }
      }>

      setApplications(
        rows.map((row) => {
          const p = row.property
          const title = p?.title || p?.address_line1 || 'Property'
          const beds = formatBedrooms(p?.bedrooms ?? 0)
          const baths = formatBathrooms(p?.bathrooms)
          const sqft = p?.sqft ? `${p.sqft} sq ft` : ''
          const meta = [beds, baths, sqft].filter(Boolean).join(' • ')
          const landlordName = p?.landlord?.display_name ?? 'Landlord'
          return {
            id: row.id,
            propertyTitle: title,
            propertyMeta: meta,
            landlord: landlordName,
            appliedDate: formatAppliedDate(row.created_at),
            status: formatStatus(row.status),
          }
        }),
      )
    }

    loadApplications()
  }, [user])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[2rem] font-medium text-gray-900">Your Applications</h1>
        <Link
          to="/applications/apply"
          className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Submit New Application
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-[1.75rem] font-medium text-gray-900">
            Applications ({loading ? '...' : applications.length})
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your rental applications
          </p>
        </div>

        {error ? (
          <div className="px-5 py-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">Loading applications...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No applications yet.</div>
            ) : (
              applications.map((app) => (
                <Link
                  key={app.id}
                  to={`/account/application/${app.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[1.1rem] font-medium text-gray-900">{app.propertyTitle}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{app.propertyMeta}</p>
                    <p className="mt-1 text-sm text-gray-600">Landlord: {app.landlord}</p>
                    <p className="mt-0.5 text-sm text-gray-500">Applied: {app.appliedDate}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        app.status === 'Accepted'
                          ? 'bg-green-100 text-green-800'
                          : app.status === 'Declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {app.status}
                    </span>
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
