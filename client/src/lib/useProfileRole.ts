import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type ProfileRole = 'tenant' | 'landlord'

export type UseProfileRoleResult = {
  role: ProfileRole | null
  displayName: string | null
  /** Set when role is landlord and they have completed the onboarding survey */
  landlordSurveyCompletedAt: string | null
  /** Set when role is tenant and they have completed the compatibility survey */
  tenantSurveyCompletedAt: string | null
  loading: boolean
}

/**
 * Returns the current user's profile role (and displayName). Never defaults to tenant
 * so that landlords never see tenant UI while role is loading.
 */
export function useProfileRole(user: User | null): UseProfileRoleResult {
  const [role, setRole] = useState<ProfileRole | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [landlordSurveyCompletedAt, setLandlordSurveyCompletedAt] = useState<string | null>(null)
  const [tenantSurveyCompletedAt, setTenantSurveyCompletedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!user)

  useEffect(() => {
    if (!user) {
      setRole(null)
      setDisplayName(null)
      setLandlordSurveyCompletedAt(null)
      setTenantSurveyCompletedAt(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function load() {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, display_name, landlord_survey_completed_at, tenant_survey_completed_at')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      let resolved: ProfileRole = data?.role === 'landlord' ? 'landlord' : 'tenant'
      const signedUpAsLandlord = user.user_metadata?.role === 'landlord'

      if (signedUpAsLandlord && resolved !== 'landlord') {
        await supabase.from('profiles').update({ role: 'landlord' }).eq('id', user.id)
        resolved = 'landlord'
      }

      setRole(resolved)
      setDisplayName(data?.display_name?.trim() || null)
      setLandlordSurveyCompletedAt(data?.landlord_survey_completed_at ?? null)
      setTenantSurveyCompletedAt(data?.tenant_survey_completed_at ?? null)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user])

  return { role, displayName, landlordSurveyCompletedAt, tenantSurveyCompletedAt, loading }
}
