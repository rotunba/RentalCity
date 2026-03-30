export type UniversalApplicationRecord = {
  status: string
  valid_until: string
  created_at: string
}

export type UniversalApplicationDisplay = {
  statusLabel: string
  validUntilText: string
  remainingText: string
  remainingBarWidthPct: number
  isUniversalActive: boolean
}

/** Compact locale date for status cards (fits one line in narrow sidebars). */
export function formatUniversalValidUntilDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Mirrors tenant Account “Application Status” card: label, validity date, time-remaining copy, and progress bar width.
 */
export function computeUniversalApplicationDisplay(
  universalApplication: UniversalApplicationRecord | null,
  now = new Date(),
): UniversalApplicationDisplay {
  const universalCreatedAt = universalApplication?.created_at
    ? new Date(universalApplication.created_at)
    : null
  const universalValidUntil = universalApplication?.valid_until
    ? new Date(universalApplication.valid_until)
    : null

  const isUniversalActive =
    universalApplication != null &&
    universalApplication.status === 'active' &&
    universalValidUntil != null &&
    universalValidUntil.getTime() > now.getTime()

  if (!universalApplication) {
    return {
      statusLabel: 'Not started',
      validUntilText: '—',
      remainingText: '—',
      remainingBarWidthPct: 0,
      isUniversalActive: false,
    }
  }

  if (universalApplication.status === 'withdrawn') {
    const validUntilText =
      universalValidUntil != null ? formatUniversalValidUntilDate(universalValidUntil) : '—'
    return {
      statusLabel: 'Withdrawn',
      validUntilText,
      remainingText: '—',
      remainingBarWidthPct: 0,
      isUniversalActive: false,
    }
  }

  let statusLabel = 'Not started'
  let validUntilText = '—'
  let remainingText = '—'
  let remainingElapsedPercent = 0

  if (universalCreatedAt && universalValidUntil) {
    validUntilText = formatUniversalValidUntilDate(universalValidUntil)

    const totalMs = universalValidUntil.getTime() - universalCreatedAt.getTime()
    const elapsedMs = now.getTime() - universalCreatedAt.getTime()
    const remainingMs = universalValidUntil.getTime() - now.getTime()

    if (universalApplication.status === 'expired' || remainingMs <= 0 || totalMs <= 0) {
      statusLabel = 'Expired'
      remainingText = 'Expired'
      remainingElapsedPercent = 100
    } else {
      statusLabel = 'Active'
      const remainingDays = Math.round(remainingMs / (1000 * 60 * 60 * 24))
      const remainingMonths = Math.floor(remainingDays / 30)
      const remainingDaysRemainder = remainingDays % 30
      remainingText = `${remainingMonths} months, ${remainingDaysRemainder} days`
      remainingElapsedPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
    }
  } else if (universalApplication) {
    statusLabel =
      universalApplication.status === 'active'
        ? 'Active'
        : universalApplication.status === 'expired'
          ? 'Expired'
          : 'Not started'
  }

  const remainingBarWidthPct =
    universalApplication && universalCreatedAt && universalValidUntil
      ? Math.max(0, Math.min(100, 100 - remainingElapsedPercent))
      : 0

  return {
    statusLabel,
    validUntilText,
    remainingText,
    remainingBarWidthPct,
    isUniversalActive,
  }
}

/** Normalize PostgREST / RPC row shapes (snake_case vs rare camelCase, single object vs array). */
export function parseUniversalApplicationRecord(raw: unknown): UniversalApplicationRecord | null {
  if (raw == null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const statusRaw = r.status ?? (r as { Status?: unknown }).Status
  const vuRaw = r.valid_until ?? (r as { validUntil?: unknown }).validUntil
  const caRaw = r.created_at ?? (r as { createdAt?: unknown }).createdAt
  if (typeof statusRaw !== 'string' || !statusRaw.trim()) return null
  const toIso = (v: unknown): string | null => {
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString()
    return null
  }
  const valid_until = toIso(vuRaw)
  const created_at = toIso(caRaw)
  if (!valid_until || !created_at) return null
  return { status: statusRaw.trim(), valid_until, created_at }
}

export function universalApplicationRpcRows(data: unknown): unknown[] {
  if (data == null) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'object') return [data]
  return []
}
