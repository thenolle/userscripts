import type { LimitKey } from './types'

const RESET_KEYS = [
	'reset_at',
	'resetAt',
	'resets_at',
	'resetsAt',
	'reset_time',
	'resetTime',
	'reset_timestamp',
	'resetTimestamp',
	'reset_at_ms',
	'resetAtMs',
	'next_reset',
	'nextReset',
	'period_end',
	'periodEnd',
	'window_end',
	'windowEnd'
] as const

const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null

const timestamp = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value < 1_000_000_000_000 ? value * 1000 : value
	}

	if (typeof value !== 'string' || !value.trim()) return null
	const numeric = Number(value)
	if (Number.isFinite(numeric)) return timestamp(numeric)
	const parsed = Date.parse(value)
	return Number.isFinite(parsed) ? parsed : null
}

const directReset = (value: unknown): number | null => {
	const object = record(value)
	if (!object) return null
	for (const key of RESET_KEYS) {
		const found = timestamp(object[key])
		if (found !== null) return found
	}
	return null
}

export const findResetTimestamp = (data: unknown, key?: LimitKey): number | null => {
	const root = record(data)
	if (!root || !key) return null

	const short = key.replace(/^remaining_/, '')

	for (const name of [
		`${key}_reset_at`,
		`${short}_reset_at`,
		`${key}_reset_timestamp`,
		`${short}_reset_timestamp`
	]) {
		const found = timestamp(root[name])
		if (found !== null) return found
	}

	for (const name of [key, short]) {
		const found = directReset(root[name])
		if (found !== null) return found
	}

	for (const container of ['limits', 'rate_limits', 'resets']) {
		const group = record(root[container])
		if (!group) continue
		for (const name of [key, short]) {
			const found = directReset(group[name]) ?? timestamp(group[name])
			if (found !== null) return found
		}
	}

	return null
}
