import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatBathrooms, formatBedrooms, formatCurrency } from '../lib/propertyDraft'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

type PropertyStatus = 'Active' | 'Draft' | 'Inactive' | 'Leased'

type PropertyCard = {
  id: string
  title: string
  address: string
  price: string
  details: string
  status: PropertyStatus
  photoUrl: string | null
  photoLabel: string
}

function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      {status}
    </span>
  )
}

export function PropertiesPage() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<PropertyCard[]>([])
  const [deleteModalProperty, setDeleteModalProperty] = useState<PropertyCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProperties() {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('properties')
        .select(
          'id, title, address_line1, city, state, postal_code, bedrooms, bathrooms, sqft, monthly_rent_cents, status, photo_labels, photo_urls',
        )
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false })

      setLoading(false)

      if (error) {
        setError(error.message)
        return
      }

      setProperties(
        (data ?? []).map((property) => ({
          id: property.id,
          title: property.title || property.address_line1,
          address: [property.address_line1, property.city, property.state, property.postal_code]
            .filter(Boolean)
            .join(', '),
          price: `${formatCurrency(property.monthly_rent_cents)}/month`,
          details: [
            formatBedrooms(property.bedrooms),
            formatBathrooms(property.bathrooms),
            property.sqft ? `${property.sqft.toLocaleString()} sq ft` : null,
          ]
            .filter(Boolean)
            .join('  •  '),
          status:
            property.status === 'draft'
              ? 'Draft'
              : property.status === 'leased'
                ? 'Leased'
                : property.status === 'inactive'
                  ? 'Inactive'
                  : 'Active',
          photoUrl: property.photo_urls?.[0] ?? null,
          photoLabel: property.photo_labels?.[0] || 'Property Image',
        })),
      )
    }

    loadProperties()
  }, [user])

  const empty = useMemo(() => !loading && !error && properties.length === 0, [error, loading, properties.length])

  async function handleDeleteProperty() {
    if (!deleteModalProperty) return

    const propertyId = deleteModalProperty.id
    const { error } = await supabase.from('properties').delete().eq('id', propertyId)
    if (error) {
      setError(error.message)
      return
    }

    setProperties((current) => current.filter((property) => property.id !== propertyId))
    setDeleteModalProperty(null)
  }

  return (
    <>
      <div className="flex min-h-full flex-col py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[2rem] font-medium text-gray-900">My Properties</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your rental properties and find the perfect tenants
            </p>
          </div>

          <Link
            to="/onboarding/property/intro"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Property
          </Link>
        </div>

        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

        {loading ? <p className="mt-7 text-sm text-gray-500">Loading properties...</p> : null}

        {empty ? (
          <section className="mt-7 rounded-2xl border border-dashed border-gray-300 bg-white px-8 py-14 text-center">
            <h2 className="text-[1.5rem] font-medium text-gray-900">No properties yet</h2>
            <p className="mt-3 text-sm text-gray-600">
              Publish your first property to start receiving tenant interest.
            </p>
            <Link
              to="/onboarding/property/intro"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Property
            </Link>
          </section>
        ) : null}

        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <article key={property.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex aspect-[16/8.4] items-center justify-center overflow-hidden bg-gray-300">
                {property.photoUrl ? (
                  <img
                    src={property.photoUrl}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-white/90">{property.photoLabel}</span>
                )}
              </div>

              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[1.45rem] font-medium leading-8 text-gray-900">{property.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{property.address}</p>
                  </div>
                  <PropertyStatusBadge status={property.status} />
                </div>

                <p className="mt-3 text-[1.15rem] font-medium text-gray-900">{property.price}</p>
                <p className="mt-3 text-sm text-gray-500">{property.details}</p>

                <div className="mt-4 flex items-center gap-3">
                  <Link
                    to={`/properties/${property.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    View Property
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete ${property.title}`}
                    onClick={() => setDeleteModalProperty(property)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>

      {deleteModalProperty ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.93 19h12.14c1.54 0 2.5-1.67 1.73-3L13.73 5c-.77-1.33-2.69-1.33-3.46 0L4.2 16c-.77 1.33.19 3 1.73 3z" />
                </svg>
              </div>
            </div>

            <h2 className="mt-4 text-center text-[1.6rem] font-medium text-gray-900">Delete Property</h2>
            <p className="mt-3 text-center text-sm leading-6 text-gray-600">
              Are you sure you want to delete this property? This action cannot be undone.
            </p>

            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-300 text-[10px] text-white/90">
                  Image
                </div>
                <div>
                  <p className="text-[1.05rem] font-medium text-gray-900">{deleteModalProperty.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{deleteModalProperty.address}</p>
                  <p className="mt-1 text-[1.05rem] font-medium text-gray-900">{deleteModalProperty.price}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.93 19h12.14c1.54 0 2.5-1.67 1.73-3L13.73 5c-.77-1.33-2.69-1.33-3.46 0L4.2 16c-.77 1.33.19 3 1.73 3z" />
                </svg>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-800">This will permanently delete:</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• Property listing and all photos</li>
                    <li>• Associated match data</li>
                    <li>• Conversation history with tenants</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalProperty(null)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProperty}
                className="inline-flex items-center justify-center rounded-lg bg-gray-600 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700"
              >
                Delete Property
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
