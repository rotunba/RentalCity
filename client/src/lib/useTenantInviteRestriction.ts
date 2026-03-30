import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type TenantInviteRestrictionState =
  | { active: false }
  | { active: true; endsAt: string; landlordLabel: string }

export function useTenantInviteRestriction(
  user: User | null,
  profileRole: 'tenant' | 'landlord' | 'admin' | null,
  refreshKey = 0,
) {
  const [state, setState] = useState<TenantInviteRestrictionState>({ active: false })

  useEffect(() => {
    if (!user || profileRole !== 'tenant') {
      setState({ active: false })
      return
    }

    let cancelled = false
    const nowIso = new Date().toISOString()
    ;(async () => {
      const { data, error } = await supabase
        .from('tenant_invite_restrictions')
        .select('ends_at, landlord_display_name')
        .eq('tenant_id', user.id)
        .gt('ends_at', nowIso)
        .maybeSingle()

      if (cancelled) return
      if (error || !data) {
        setState({ active: false })
        return
      }
      setState({
        active: true,
        endsAt: data.ends_at,
        landlordLabel: data.landlord_display_name?.trim() || 'your host',
      })
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, profileRole, refreshKey])

  return state
}
