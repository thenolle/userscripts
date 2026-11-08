const ACTIVE_ACCOUNT_COOKIE = '__Host-pplx-last-active-account'
const ACTIVE_PATTERN = new RegExp(`(?:^|;\\s*)${ACTIVE_ACCOUNT_COOKIE}=([^;]+)`)
const SESSION_PATTERN = /(?:^|;\s*)__Secure-pplx\.session\.([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})=/i

export const readCookieAccountId = (): string | null => {
  const jar = document.cookie
  const active = ACTIVE_PATTERN.exec(jar)?.[1]
  if (active) return decodeURIComponent(active)
  return SESSION_PATTERN.exec(jar)?.[1] ?? null
}