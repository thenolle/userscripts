const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

export const timeAgo = (then: number, now: number): string => {
  const age = Math.max(0, now - then)
  if (age < MINUTE) return 'just now'
  if (age < HOUR) return `${Math.floor(age / MINUTE)}m ago`
  if (age < DAY) return `${Math.floor(age / HOUR)}h ago`
  if (age < 30 * DAY) return `${Math.floor(age / DAY)}d ago`
  return new Date(then).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export const threadLabel = (path: string): string => {
  const segment = decodeURIComponent(path.split('/').filter(Boolean).pop() ?? '')
  const words = segment.replace(/[-_]+/g, ' ').replace(/\s+[A-Za-z0-9]{16,}$/, '').trim()
  if (!words || /^[A-Za-z0-9]{12,}$/.test(words)) return 'Thread'
  return words.length > 48 ? `${words.slice(0, 47)}…` : words
}
