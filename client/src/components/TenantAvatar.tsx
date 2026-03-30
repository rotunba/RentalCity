type TenantAvatarProps = {
  name: string
  avatarUrl: string | null
  sizeClass?: string
  textClass?: string
}

export function TenantAvatar({
  name,
  avatarUrl,
  sizeClass = 'h-14 w-14',
  textClass = 'text-sm',
}: TenantAvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const box = `flex ${sizeClass} shrink-0 items-center justify-center rounded-full border border-gray-200`

  if (avatarUrl?.trim()) {
    return (
      <img
        src={avatarUrl.trim()}
        alt={`${name} profile photo`}
        className={`${sizeClass} shrink-0 rounded-full border border-gray-200 object-cover ring-1 ring-black/5`}
      />
    )
  }

  return (
    <div
      className={`${box} bg-[radial-gradient(circle_at_top,_#d6c7ba,_#8a6f5a)] font-medium text-white ${textClass}`}
      role="img"
      aria-label={`${name} — no profile photo`}
    >
      {initials || '?'}
    </div>
  )
}
