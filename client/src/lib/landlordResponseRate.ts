import type { SupabaseClient } from '@supabase/supabase-js'

/** First inbound tenant message → landlord’s first reply. */
const MESSAGE_SLA_MS = 48 * 60 * 60 * 1000

/** Unlocked pending application → approve/reject (or overdue if still pending). */
const APPLICATION_SLA_MS = 7 * 24 * 60 * 60 * 1000

/** Accepted tenants: rating submitted within this window after approval. */
const RATING_SLA_MS = 14 * 24 * 60 * 60 * 1000

/** Only score rating SLAs for acceptances at least this old (avoid same-day noise). */
const RATING_MIN_AGE_MS = 3 * 24 * 60 * 60 * 1000

export type LandlordResponseRateResult = {
  overallPercent: number | null
  messagePercent: number | null
  applicationPercent: number | null
  ratingPercent: number | null
  counts: {
    messages: { met: number; total: number }
    applications: { met: number; total: number }
    ratings: { met: number; total: number }
  }
}

function pct(met: number, total: number): number | null {
  if (total <= 0) return null
  return Math.round((met / total) * 1000) / 10
}

function weightedOverall(
  parts: Array<{ pct: number | null; weight: number }>,
): number | null {
  let wSum = 0
  let score = 0
  for (const p of parts) {
    if (p.pct != null) {
      score += p.pct * p.weight
      wSum += p.weight
    }
  }
  if (wSum <= 0) return null
  return Math.round((score / wSum) * 10) / 10
}

/**
 * Landlord responsiveness (independent signals, then weighted average of available parts):
 *
 * 1) Messages — Per thread: after the first inbound tenant message, the landlord’s first reply
 *    must arrive within 48h. Threads still inside that window (no reply yet) are excluded.
 *    Threads past the window with no landlord reply count as a miss.
 *
 * 2) Applications — Unlocked applications: approve/reject within 7 days of unlocked_at, or
 *    still pending but unlocked longer than 7 days counts as a miss. (updated_at approximates decision time.)
 *
 * 3) Post-match reviews — Accepted applications at least 3 days old: a tenant_rating for that
 *    tenant must exist with created_at within 14 days after approval (updated_at). Only evaluated
 *    once acceptance is older than 14 days + grace so the window has closed.
 *
 * Weights when multiple parts exist: 40% messages, 40% applications, 20% ratings.
 * Unused parts are dropped and weights re-normalized.
 */
export async function computeLandlordResponseRate(
  client: SupabaseClient,
  landlordId: string,
): Promise<LandlordResponseRateResult> {
  const counts = {
    messages: { met: 0, total: 0 },
    applications: { met: 0, total: 0 },
    ratings: { met: 0, total: 0 },
  }

  const now = Date.now()

  const [threadsRes, appsRes, ratingsRes] = await Promise.all([
    client.from('message_threads').select('id').eq('landlord_id', landlordId),
    client
      .from('applications')
      .select('id, tenant_id, status, unlocked_at, updated_at')
      .not('unlocked_at', 'is', null),
    client.from('tenant_ratings').select('tenant_external_id, created_at').eq('landlord_id', landlordId),
  ])

  const threadIds = (threadsRes.data ?? []).map((t: { id: string }) => t.id)

  type MsgRow = { thread_id: string; sender_id: string; created_at: string }
  let messages: MsgRow[] = []
  if (threadIds.length > 0) {
    const { data } = await client
      .from('messages')
      .select('thread_id, sender_id, created_at')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: true })
    messages = (data ?? []) as MsgRow[]
  }

  const byThread = new Map<string, MsgRow[]>()
  for (const m of messages) {
    const list = byThread.get(m.thread_id) ?? []
    list.push(m)
    byThread.set(m.thread_id, list)
  }

  for (const tid of threadIds) {
    const list = byThread.get(tid) ?? []
    const firstTenantIdx = list.findIndex((m) => m.sender_id !== landlordId)
    if (firstTenantIdx < 0) continue

    const firstTenant = list[firstTenantIdx]!
    const t0 = new Date(firstTenant.created_at).getTime()
    const landlordReply = list.find(
      (m) => m.sender_id === landlordId && new Date(m.created_at).getTime() > t0,
    )

    if (!landlordReply) {
      if (now - t0 > MESSAGE_SLA_MS) {
        counts.messages.total++
      }
      continue
    }

    const replyT = new Date(landlordReply.created_at).getTime()
    counts.messages.total++
    if (replyT - t0 <= MESSAGE_SLA_MS) counts.messages.met++
  }

  type AppRow = {
    id: string
    tenant_id: string
    status: string
    unlocked_at: string
    updated_at: string
  }
  const apps = (appsRes.data ?? []) as AppRow[]

  for (const app of apps) {
    const u0 = new Date(app.unlocked_at).getTime()
    const st = (app.status ?? '').toLowerCase()

    if (st === 'pending') {
      if (now - u0 > APPLICATION_SLA_MS) {
        counts.applications.total++
      }
      continue
    }

    if (st === 'approved' || st === 'rejected') {
      const decidedAt = new Date(app.updated_at).getTime()
      counts.applications.total++
      if (decidedAt - u0 <= APPLICATION_SLA_MS) counts.applications.met++
    }
  }

  type RatingRow = { tenant_external_id: string; created_at: string }
  const ratingRows = (ratingsRes.data ?? []) as RatingRow[]
  const ratingsByTenant = new Map<string, RatingRow[]>()
  for (const r of ratingRows) {
    const list = ratingsByTenant.get(r.tenant_external_id) ?? []
    list.push(r)
    ratingsByTenant.set(r.tenant_external_id, list)
  }

  for (const app of apps) {
    if ((app.status ?? '').toLowerCase() !== 'approved') continue

    const approvalT = new Date(app.updated_at).getTime()
    if (now - approvalT < RATING_MIN_AGE_MS) continue
    if (now - approvalT < RATING_SLA_MS) continue

    counts.ratings.total++
    const deadline = approvalT + RATING_SLA_MS
    const list = ratingsByTenant.get(app.tenant_id) ?? []
    const inTime = list.some((r) => new Date(r.created_at).getTime() <= deadline)
    if (inTime) counts.ratings.met++
  }

  const messagePercent = pct(counts.messages.met, counts.messages.total)
  const applicationPercent = pct(counts.applications.met, counts.applications.total)
  const ratingPercent = pct(counts.ratings.met, counts.ratings.total)

  const overallPercent = weightedOverall([
    { pct: messagePercent, weight: 0.4 },
    { pct: applicationPercent, weight: 0.4 },
    { pct: ratingPercent, weight: 0.2 },
  ])

  return {
    overallPercent,
    messagePercent,
    applicationPercent,
    ratingPercent,
    counts,
  }
}
