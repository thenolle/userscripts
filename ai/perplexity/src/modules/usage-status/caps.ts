import type { LimitKey, RateLimitResponse } from './types'

const candidates = (name: string): string[] => [`limit_${name}`, `${name}_limit`, `max_${name}`, `${name}_max`, `total_${name}`, `${name}_total`, `cap_${name}`, `${name}_cap`]

const isCap = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0

export const findCap = (rate: RateLimitResponse | null, key: LimitKey): number | null => {
	if (!rate) return null
	const root = rate as Record<string, unknown>

	for (const name of candidates(key.replace(/^remaining_/, ''))) {
		const value = root[name]
		if (isCap(value)) return value
	}

	return null
}
