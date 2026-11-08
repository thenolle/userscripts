const RESET_KEYS = new Set(['reset_at', 'resetAt', 'resets_at', 'resetsAt', 'reset_time', 'resetTime', 'reset_timestamp', 'resetTimestamp', 'reset_at_ms', 'resetAtMs', 'next_reset', 'nextReset', 'period_end', 'periodEnd', 'window_end', 'windowEnd'])

const toTimestamp = (value: unknown): number | null => {
  if (typeof value === 'number') {
    const timestamp = value < 1_000_000_000_000 ? value * 1000 : value
    return Number.isFinite(timestamp) ? timestamp : null
  }
  if (typeof value === 'string') {
    const timestamp = Date.parse(value)
    return Number.isFinite(timestamp) ? timestamp : null
  }
  return null
}

export const findResetTimestamp = (data: unknown): number | null => {
  const visited = new WeakSet<object>()
  const find = (value: unknown): number | null => {
    if (!value || typeof value !== 'object' || visited.has(value)) return null
    visited.add(value)
    for (const [key, nested] of Object.entries(value)) {
      if (RESET_KEYS.has(key)) {
        const timestamp = toTimestamp(nested)
        if (timestamp) return timestamp
      }
      const found = find(nested)
      if (found) return found
    }
    return null
  }
  return find(data)
}