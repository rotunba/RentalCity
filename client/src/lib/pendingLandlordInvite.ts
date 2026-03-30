const KEY = 'rental-city-pending-landlord-invite-token'

export function setPendingLandlordInviteToken(token: string) {
  try {
    sessionStorage.setItem(KEY, token)
  } catch {
    /* ignore */
  }
}

export function getPendingLandlordInviteToken(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearPendingLandlordInviteToken() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
