import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

type Profile = {
  display_name: string | null
  avatar_url: string | null
  phone: string | null
} | null

export function LandlordProfilePreviewPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, phone')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(data)
      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  const name = profile?.display_name?.trim() || 'Your Name'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[2rem] font-medium text-gray-900">Profile Preview</h1>
        <Link
          to="/account/edit"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Edit
        </Link>
      </div>

      <p className="text-sm text-gray-600">This is how your profile appears to tenants browsing properties.</p>

      <div className="max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-600">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="h-16 w-16 object-cover" />
            ) : (
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
            <p className="mt-1 text-sm text-gray-500">Property Manager</p>
            {profile?.phone ? (
              <p className="mt-2 text-sm text-gray-600">{profile.phone}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
