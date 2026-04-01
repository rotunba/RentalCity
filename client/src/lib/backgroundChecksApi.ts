export async function startUniversalBackgroundCheck(
  accessToken: string,
  universalApplicationId: string,
): Promise<{ reportKey: string; inviteUrl: string | null }> {
  const res = await fetch('/api/background-checks/universal/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ universalApplicationId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to start background check')
  }
  return (await res.json()) as { reportKey: string; inviteUrl: string | null }
}

export async function refreshBackgroundCheckReport(
  accessToken: string,
  reportKey: string,
): Promise<{
  ok: true
  reportStatus: string | null
  backgroundStatus: string | null
  employmentStatus: string | null
  backgroundPass: boolean | null
  incomePass: boolean | null
}> {
  const res = await fetch('/api/background-checks/report/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ reportKey }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to refresh background check')
  }
  return (await res.json()) as any
}

