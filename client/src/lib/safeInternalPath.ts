/** Same-origin app paths only (avoid open redirects). */
export function safeInternalPath(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null
  const t = String(raw).trim()
  if (!t.startsWith('/') || t.startsWith('//')) return null
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)) return null
  return t
}
