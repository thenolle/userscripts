import type { ScriptStorage } from '@nolly/core'

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

export interface RecoveryScenario {
	readonly units: number
	readonly estimatedMs: number
}

export interface QuotaReport {
	readonly label: string
	readonly remaining: number
	readonly observedAt: number
	readonly cap: number | null
	readonly peak: number
	readonly observations: number
	readonly lastIncrease: {
		readonly from: number
		readonly to: number
		readonly units: number
	} | null
	readonly sampledMs: number
	readonly netRecovered: number
	readonly netSpent: number
	readonly recoveryPerHour: number | null
	readonly rateSpread: number | null
	readonly positiveIntervals: number
	readonly scenarios: readonly RecoveryScenario[]
	readonly fullMs: number | null
	readonly resetAt: number | null
}

const KEY = 'quota-insights:v1'
const DAY = 86_400_000
const MAX_POINTS = 2_000
const MAX_COUNTERS = 64
const MAX_GAP = 5 * 60_000
const MIN_SPAN = 30 * 60_000
const MAX_AGE = 30 * DAY

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const validPoint = (value: unknown): value is QuotaObservation => {
	if (!value || typeof value !== 'object') return false
	const point = value as Partial<QuotaObservation>
	return finite(point.at) && finite(point.remaining) && point.remaining >= 0 && (point.cap === null || finite(point.cap)) && (point.resetAt === null || finite(point.resetAt))
}

const median = (values: readonly number[]): number => {
	const sorted = [...values].sort((a, b) => a - b)
	const middle = Math.floor(sorted.length / 2)
	if (!sorted.length) return 0
	return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

export class QuotaLedger {
	constructor(private readonly storage: ScriptStorage) { }

	observe(scope: string, key: string, label: string, remaining: number, cap: number | null = null, resetAt: number | null = null, at = Date.now()): void {
		if (!scope || !finite(remaining) || remaining < 0 || !finite(at)) return
		const database = this.read()
		const id = JSON.stringify([scope, key])
		const previous = database.counters[id]
		const points = previous?.points ?? []
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

	reports(now = Date.now()): QuotaReport[] {
		const database = this.read()
		return Object.values(database.counters).filter((counter) => counter.scope === database.activeScope).flatMap((counter): QuotaReport[] => {
			const points = counter.points.filter((point) => point.at <= now && now - point.at <= MAX_AGE).sort((a, b) => a.at - b.at)
			const latest = points.at(-1)
			if (!latest) return []
			let lastIncrease: QuotaReport['lastIncrease'] = null
			let sampledMs = 0
			let netRecovered = 0
			let netSpent = 0
			let positiveIntervals = 0
			const rates: number[] = []
			for (let index = 1; index < points.length; index++) {
				const previous = points[index - 1]!
				const current = points[index]!
				const gap = current.at - previous.at
				const delta = current.remaining - previous.remaining
				if (delta > 0) lastIncrease = { from: previous.at, to: current.at, units: delta }
				if (now - current.at > 7 * DAY || gap <= 0 || gap > MAX_GAP) continue
				const capped = previous.cap !== null && previous.remaining >= previous.cap
				const reachedCap = current.cap !== null && current.remaining >= current.cap
				if (capped || reachedCap) continue
				sampledMs += gap
				netRecovered += Math.max(0, delta)
				netSpent += Math.max(0, -delta)
				if (delta > 0) positiveIntervals++
				rates.push(Math.max(0, delta) * 3_600_000 / gap)
			}
			const enough = sampledMs >= MIN_SPAN && positiveIntervals >= 3 && now - latest.at <= MAX_GAP && netRecovered > 0
			const rate = enough ? netRecovered * 3_600_000 / sampledMs : null
			const center = median(rates)
			const spread = rates.length ? 1.4826 * median(rates.map((value) => Math.abs(value - center))) : null
			const missing = latest.cap === null ? null : Math.max(0, latest.cap - latest.remaining)
			const scenarios = rate !== null ? [1, 5].filter((units) => missing === null || units <= missing).map((units) => ({ units, estimatedMs: units / rate * 3_600_000 })) : []
			return [{
				label: counter.label,
				remaining: latest.remaining,
				observedAt: latest.at,
				cap: latest.cap,
				peak: points.reduce((peak, point) => Math.max(peak, point.remaining), 0),
				observations: points.length,
				lastIncrease,
				sampledMs,
				netRecovered,
				netSpent,
				recoveryPerHour: rate,
				rateSpread: enough ? spread : null,
				positiveIntervals,
				scenarios,
				fullMs: missing === 0 ? 0 : missing !== null && rate !== null ? missing / rate * 3_600_000 : null,
				resetAt: latest.resetAt
			}]
		})
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
				counters[id] = {
					scope: candidate.scope,
					key: candidate.key,
					label: candidate.label,
					points: candidate.points.filter(validPoint).slice(-MAX_POINTS)
				}
			}
		}
		return {
			activeScope: typeof database.activeScope === 'string' ? database.activeScope : '',
			counters
		}
	}
}
