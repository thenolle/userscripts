import type { ScriptStorage } from '@nolly/core'

export type QuotaLevel = 'ok' | 'warning' | 'critical' | 'empty' | 'unknown'

export const LEVEL_LABEL: Readonly<Record<QuotaLevel, string>> = {
	ok: 'OK',
	warning: 'Warning',
	critical: 'Critical',
	empty: 'Empty',
	unknown: 'Unknown'
}

export const LEVEL_GLYPH: Readonly<Record<QuotaLevel, string>> = {
	ok: '✓',
	warning: '!',
	critical: '✕',
	empty: '✕',
	unknown: '?'
}

export const QUOTA_STALE_MS = 5 * 60_000

const OK_RATIO = 0.4
const CRITICAL_RATIO = 0.15
const CRITICAL_UNITS = 1
const WARNING_UNITS = 3

export const quotaLevel = (remaining: number | null, cap: number | null = null): QuotaLevel => {
	if (remaining === null || !Number.isFinite(remaining)) return 'unknown'
	if (remaining <= 0) return 'empty'
	if (remaining <= CRITICAL_UNITS) return 'critical'
	if (cap !== null && cap > 0) {
		const ratio = remaining / cap
		return ratio <= CRITICAL_RATIO ? 'critical' : ratio <= OK_RATIO ? 'warning' : 'ok'
	}
	return remaining <= WARNING_UNITS ? 'warning' : 'ok'
}

const SEVERITY: Readonly<Record<QuotaLevel, number>> = { empty: 4, critical: 3, warning: 2, unknown: 1, ok: 0 }

export const worstLevel = (levels: readonly QuotaLevel[]): QuotaLevel =>
	levels.reduce<QuotaLevel>((worst, level) => (SEVERITY[level] > SEVERITY[worst] ? level : worst), 'ok')

export interface QuotaObservation {
	readonly at: number
	readonly remaining: number
	readonly cap: number | null
	readonly resetAt: number | null
}

interface Counter {
	readonly key: string
	readonly label: string
	readonly scope: string
	points: QuotaObservation[]
}

interface Database {
	activeScope: string
	counters: Record<string, Counter>
}

export interface Forecast {
	readonly source: 'api-reset' | 'cadence' | 'rate'
	readonly nextAt: number | null
	readonly plus: readonly { readonly units: number; readonly at: number }[]
	readonly fullAt: number | null
	readonly marginMs: number
	readonly relativeError: number
	readonly overdue: boolean
	readonly basis: string
}

export interface QuotaReport {
	readonly key: string
	readonly scope: string
	readonly label: string
	readonly level: QuotaLevel
	readonly remaining: number
	readonly observedAt: number
	readonly cap: number | null
	readonly peak: number
	readonly target: number | null
	readonly targetKind: 'api-cap' | 'observed-peak' | null
	readonly observations: number
	readonly lastIncrease: { readonly from: number; readonly to: number; readonly units: number } | null
	readonly sampledMs: number
	readonly netRecovered: number
	readonly netSpent: number
	readonly recoveryPerHour: number | null
	readonly positiveIntervals: number
	readonly history: readonly (readonly [number, number])[]
	readonly forecast: Forecast | null
	readonly resetAt: number | null
}

interface Chain {
	readonly mid: number
	readonly units: number
	readonly width: number
}

interface Period {
	readonly ms: number
	readonly units: number
}

interface Cadence {
	readonly periodMs: number
	readonly unitsPerEvent: number
	readonly anchor: number
	readonly halfWidth: number
	readonly relative: number
	readonly events: number
}

const KEY = 'quota-insights:v1'
const HOUR = 3_600_000
const DAY = 86_400_000
const MAX_POINTS = 2_000
const MAX_COUNTERS = 64
const RATE_GAP = 5 * 60_000
const EVENT_GAP = 10 * 60_000
const MIN_SPAN = 30 * 60_000
const MAX_AGE = 30 * DAY
const RECENT = 7 * DAY
const MAX_RELATIVE_SPREAD = 0.3
const RESET_GRACE = 60_000
const TARGETS = [1, 5] as const

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const validPoint = (value: unknown): value is QuotaObservation => {
	if (!value || typeof value !== 'object') return false
	const point = value as Partial<QuotaObservation>
	return finite(point.at) && finite(point.remaining) && point.remaining >= 0 && (point.cap === null || finite(point.cap)) && (point.resetAt === null || finite(point.resetAt))
}

const median = (values: readonly number[]): number => {
	if (!values.length) return 0
	const sorted = [...values].sort((a, b) => a - b)
	const middle = Math.floor(sorted.length / 2)
	return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

const minutes = (ms: number): string => `${Math.max(1, Math.round(ms / 60_000))}m`

const cadenceOf = (periods: readonly Period[], chain: Chain | null): Cadence | null => {
	const usable = periods.filter((period) => period.ms > 0)
	if (usable.length < 3 || !chain) return null
	const periodMs = median(usable.map((period) => period.ms))
	const spread = 1.4826 * median(usable.map((period) => Math.abs(period.ms - periodMs)))
	if (periodMs <= 0 || spread / periodMs > MAX_RELATIVE_SPREAD) return null
	return {
		periodMs,
		unitsPerEvent: Math.max(1, median(usable.map((period) => period.units))),
		anchor: chain.mid,
		halfWidth: chain.width / 2,
		relative: spread / periodMs,
		events: usable.length
	}
}

interface ForecastInput {
	readonly now: number
	readonly latest: QuotaObservation
	readonly missing: number | null
	readonly restores: number
	readonly periods: readonly Period[]
	readonly chain: Chain | null
	readonly rate: number | null
	readonly positiveIntervals: number
}

const buildForecast = ({ now, latest, missing, restores, periods, chain, rate, positiveIntervals }: ForecastInput): Forecast | null => {
	const applicable = TARGETS.filter((units) => missing === null || units <= missing)
	const reset = latest.resetAt
	if (reset !== null && reset > now) {
		const proven = restores > 0
		return {
			source: 'api-reset',
			nextAt: reset,
			plus: (proven ? applicable : applicable.filter((units) => units === 1)).map((units) => ({ units, at: reset })),
			fullAt: proven && missing !== null ? reset : null,
			marginMs: 0,
			relativeError: 0,
			overdue: false,
			basis: proven ? `API reset time. Past resets restored the counter to its peak ${restores} time${restores === 1 ? '' : 's'}.` : 'API-reported reset time. The refill amount is not reported.'
		}
	}
	const cadence = cadenceOf(periods, chain)
	let overdue = false
	if (cadence) {
		const expected = cadence.anchor + cadence.periodMs
		if (expected + cadence.halfWidth + cadence.relative * cadence.periodMs >= now) {
			const first = Math.max(expected, now)
			const at = (units: number): number => first + (Math.ceil(units / cadence.unitsPerEvent) - 1) * cadence.periodMs
			return {
				source: 'cadence',
				nextAt: first,
				plus: applicable.map((units) => ({ units, at: at(units) })),
				fullAt: missing === null ? null : at(missing),
				marginMs: cadence.halfWidth,
				relativeError: cadence.relative,
				overdue: false,
				basis: `Observed refill about every ${minutes(cadence.periodMs)} (+${cadence.unitsPerEvent} per refill, ${cadence.events} intervals).`
			}
		}
		overdue = true
	}
	if (rate !== null && rate > 0) {
		const at = (units: number): number => now + units / rate * HOUR
		return {
			source: 'rate',
			nextAt: at(1),
			plus: applicable.map((units) => ({ units, at: at(units) })),
			fullAt: missing === null ? null : at(missing),
			marginMs: 0,
			relativeError: Math.min(0.6, Math.max(0.15, 1 / Math.sqrt(Math.max(1, positiveIntervals)))),
			overdue: false,
			basis: `Observed average recovery of ${rate.toFixed(2)} units/hour. Refills are irregular, so this is an average.`
		}
	}
	return overdue ? { source: 'cadence', nextAt: null, plus: [], fullAt: null, marginMs: 0, relativeError: 0, overdue: true, basis: 'The usual refill time passed without an increase.' } : null
}

const compute = (counter: Counter, now: number): QuotaReport | null => {
	const points = counter.points.filter((point) => point.at <= now && now - point.at <= MAX_AGE).sort((a, b) => a.at - b.at)
	const first = points[0]
	const latest = points.at(-1)
	if (!first || !latest) return null
	let lastIncrease: QuotaReport['lastIncrease'] = null
	let sampledMs = 0
	let netRecovered = 0
	let netSpent = 0
	let positiveIntervals = 0
	let restores = 0
	let runningPeak = first.remaining
	let chain: Chain | null = null
	const periods: Period[] = []
	for (let index = 1; index < points.length; index++) {
		const previous = points[index - 1]!
		const current = points[index]!
		const gap = current.at - previous.at
		const delta = current.remaining - previous.remaining
		if (delta > 0) {
			lastIncrease = { from: previous.at, to: current.at, units: delta }
			if (previous.resetAt !== null && previous.resetAt <= current.at + RESET_GRACE && current.remaining >= runningPeak) restores++
		}
		runningPeak = Math.max(runningPeak, current.remaining)
		if (gap <= 0 || now - current.at > RECENT) continue
		if (gap > EVENT_GAP) {
			chain = null
			continue
		}
		if (delta > 0) {
			const event: Chain = { mid: previous.at + gap / 2, units: delta, width: gap }
			if (chain) periods.push({ ms: event.mid - chain.mid, units: delta })
			chain = event
		}
		if (gap > RATE_GAP || previous.cap !== current.cap) continue
		const capped = previous.cap !== null && previous.remaining >= previous.cap
		const reachedCap = current.cap !== null && current.remaining >= current.cap
		if (capped || reachedCap) continue
		sampledMs += gap
		netRecovered += Math.max(0, delta)
		netSpent += Math.max(0, -delta)
		if (delta > 0) positiveIntervals++
	}
	const peak = points.reduce((best, point) => Math.max(best, point.remaining), 0)
	const target = latest.cap ?? (peak > latest.remaining ? peak : null)
	const targetKind = latest.cap !== null ? 'api-cap' : target !== null ? 'observed-peak' : null
	const missing = target === null ? null : Math.max(0, target - latest.remaining)
	const stale = now - latest.at > QUOTA_STALE_MS
	const enough = sampledMs >= MIN_SPAN && positiveIntervals >= 3 && !stale && netRecovered > 0
	const rate = enough ? netRecovered * HOUR / sampledMs : null
	const forecast = !stale && missing !== 0 ? buildForecast({ now, latest, missing, restores, periods, chain, rate, positiveIntervals }) : null
	const recent = points.filter((point) => now - point.at <= DAY)
	const step = Math.max(1, Math.ceil(recent.length / 48))
	const history = recent.filter((_, index) => index % step === 0 || index === recent.length - 1).map((point): readonly [number, number] => [point.at, point.remaining])
	return {
		key: counter.key,
		scope: counter.scope,
		label: counter.label,
		level: quotaLevel(latest.remaining, latest.cap),
		remaining: latest.remaining,
		observedAt: latest.at,
		cap: latest.cap,
		peak,
		target,
		targetKind,
		observations: points.length,
		lastIncrease,
		sampledMs,
		netRecovered,
		netSpent,
		recoveryPerHour: rate,
		positiveIntervals,
		history,
		forecast,
		resetAt: latest.resetAt
	}
}

export class QuotaLedger {
	constructor(private readonly storage: ScriptStorage) { }

	observe(scope: string, key: string, label: string, remaining: number, cap: number | null = null, resetAt: number | null = null, at = Date.now()): void {
		if (!scope || !finite(remaining) || remaining < 0 || !finite(at)) return
		const database = this.read()
		const id = JSON.stringify([scope, key])
		const points = database.counters[id]?.points ?? []
		const last = points.at(-1)
		if (last && at <= last.at) return
		if (last && at - last.at < 1_000 && last.remaining === remaining && last.cap === cap && last.resetAt === resetAt) return
		points.push({ at, remaining, cap: finite(cap) && cap >= remaining && cap > 0 ? cap : null, resetAt: finite(resetAt) ? resetAt : null })
		database.activeScope = scope
		database.counters[id] = { scope, key, label, points: points.filter((point) => at - point.at <= MAX_AGE).slice(-MAX_POINTS) }
		const entries = Object.entries(database.counters).sort((a, b) => (b[1].points.at(-1)?.at ?? 0) - (a[1].points.at(-1)?.at ?? 0)).slice(0, MAX_COUNTERS)
		database.counters = Object.fromEntries(entries)
		this.storage.set(KEY, database)
	}

	reports(now = Date.now(), scope?: string): QuotaReport[] {
		const database = this.read()
		const wanted = scope ?? database.activeScope
		return Object.values(database.counters).filter((counter) => counter.scope === wanted).flatMap((counter) => compute(counter, now) ?? [])
	}

	private read(): Database {
		const raw = this.storage.get<unknown>(KEY, null)
		if (!raw || typeof raw !== 'object') return { activeScope: '', counters: {} }
		const database = raw as Partial<Database>
		const counters: Record<string, Counter> = {}
		if (database.counters && typeof database.counters === 'object') {
			for (const [id, candidate] of Object.entries(database.counters)) {
				if (!candidate || typeof candidate !== 'object') continue
				if (typeof candidate.scope !== 'string' || typeof candidate.key !== 'string' || typeof candidate.label !== 'string' || !Array.isArray(candidate.points)) continue
				counters[id] = { scope: candidate.scope, key: candidate.key, label: candidate.label, points: candidate.points.filter(validPoint).slice(-MAX_POINTS) }
			}
		}
		return { activeScope: typeof database.activeScope === 'string' ? database.activeScope : '', counters }
	}
}
