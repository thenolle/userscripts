export interface LimitProgress {
	readonly feature: string
	readonly remaining: number
	readonly resetAfter: string | null
}

export interface UsageSnapshot {
	readonly plan: string | null
	readonly limitReached: boolean
	readonly usedPercent: number | null
	readonly windowSeconds: number | null
	readonly resetAt: number | null
}

export const record = (value: unknown): Record<string, unknown> | null => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null)

export const text = (value: unknown): string | null => (typeof value === 'string' ? value : null)

const num = (value: unknown): number | null => (typeof value === 'number' ? value : null)

export const parseJson = (raw: string): unknown => {
	try {
		return JSON.parse(raw)
	} catch {
		return null
	}
}

export const parseLimits = (raw: unknown): LimitProgress[] => {
	const list = record(raw)?.['limits_progress']
	if (!Array.isArray(list)) return []
	return list.flatMap((entry): LimitProgress[] => {
		const item = record(entry)
		const feature = text(item?.['feature_name'])
		const remaining = num(item?.['remaining'])
		return feature && remaining !== null ? [{ feature, remaining, resetAfter: text(item?.['reset_after']) }] : []
	})
}

export const parseFileLimitMb = (raw: unknown): number | null => num(record(record(raw)?.['file_attachment_limits'])?.['max_size_mb'])

export const parseUsage = (raw: unknown): UsageSnapshot | null => {
	const root = record(raw)
	if (!root) return null
	const limit = record(root['rate_limit'])
	const window = record(limit?.['primary_window'])
	return {
		plan: text(root['plan_type']),
		limitReached: limit?.['limit_reached'] === true,
		usedPercent: num(window?.['used_percent']),
		windowSeconds: num(window?.['limit_window_seconds']),
		resetAt: num(window?.['reset_at'])
	}
}
