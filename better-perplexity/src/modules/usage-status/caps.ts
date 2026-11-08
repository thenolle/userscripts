import type { LimitKey, RateLimitResponse } from './types'

const candidates = (name: string): string[] => [`limit_${name}`, `${name}_limit`, `max_${name}`, `${name}_max`, `total_${name}`, `${name}_total`, `cap_${name}`, `${name}_cap`]

const isCap = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0

export const findCap = (rate: RateLimitResponse | null, key: LimitKey): number | null => {
  if (!rate) return null
  const names = candidates(key.replace(/^remaining_/, ''))
  const scopes: Record<string, unknown>[] = [rate as Record<string, unknown>]
  if (rate.model_specific_limits && typeof rate.model_specific_limits === 'object') scopes.push(rate.model_specific_limits)
  for (const scope of scopes) {
    for (const name of names) {
      const value = scope[name]
      if (isCap(value)) return value
    }
  }
  return null
}