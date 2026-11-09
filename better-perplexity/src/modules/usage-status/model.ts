import { estimateWindow, median, type EstimatorTuning, type Sample, type WindowEstimate } from './estimator'
import type { Forecast } from './types'

export interface Use {
	t: number
	u: number
}

export interface Batch {
	t: number
	u: number
	size: number
}

export interface Entry {
	last: number | null
	lastAt: number
	peak: number
	sentAt: number
	uses: Use[]
	history: number[]
	samples: Sample[]
	batches: Batch[]
}

export interface Send {
	readonly at: number
	readonly confirmed: boolean
}

export interface Change {
	readonly drop: number
	readonly rise: number
}

export interface ForecastInput {
	readonly now: number
	readonly prior: number
	readonly serverReset: number | null
}

export const TUNING = {
	maxUses: 600,
	maxSamples: 40,
	maxBatches: 12,
	maxAge: 60 * 86_400_000,
	minSample: 300_000,
	latency: 8_000,
	jitter: 3_000,
	batchSpread: 0.25,
	historyAge: 30 * 86_400_000,
	maxHistory: 800,
} as const

export const ESTIMATOR: EstimatorTuning = { halfLife: 12, tolerances: [1_000, 10_000, 60_000, 600_000, 3_600_000], relative: [0.002, 0.01, 0.05], consensus: 0.7, tight: 60_000 }

export const emptyEntry = (): Entry => ({
	last: null,
	lastAt: 0,
	peak: 0,
	sentAt: 0,
	uses: [],
	history: [],
	samples: [],
	batches: [],
})

const attribute = (count: number, entry: Entry, now: number, sends: readonly Send[], mid: number, half: number): Use[] => {
	const pool = sends.filter((send) => send.at > entry.sentAt && send.at >= entry.lastAt - TUNING.latency && send.at <= now).sort((a, b) => a.at - b.at)
	const confirmed = pool.filter((send) => send.confirmed)
	const source = confirmed.length ? confirmed : pool
	const fallback = (): Use => ({ t: mid, u: Math.max(half, TUNING.jitter) })
	if (!source.length) return Array.from({ length: count }, fallback)
	entry.sentAt = Math.max(entry.sentAt, source[source.length - 1]!.at)
	if (source.length === count) return source.map((send) => ({ t: send.at, u: TUNING.jitter }))
	if (source.length > count) {
		const first = source[0]!.at
		const span = source[source.length - 1]!.at - first
		return Array.from({ length: count }, () => ({ t: first + span / 2, u: span / 2 + TUNING.jitter }))
	}
	return [...source.map((send): Use => ({ t: send.at, u: TUNING.jitter })), ...Array.from({ length: count - source.length }, fallback)]
}

const refill = (entry: Entry, count: number, mid: number, half: number): void => {
	const popped = entry.uses.splice(0, count)
	const ages = popped.map((use) => mid - use.t)
	const oldest = Math.max(...ages, 0)
	const spread = oldest > 0 ? (oldest - Math.min(...ages)) / oldest : 0
	if (count >= 2 && popped.length >= 2 && spread > TUNING.batchSpread) {
		entry.batches.push({ t: mid, u: half, size: count })
		return
	}
	const from = mid - half
	const to = mid + half
	for (const use of popped) {
		const hi = to - (use.t - use.u)
		if (hi < TUNING.minSample) continue
		entry.samples.push({ lo: Math.max(0, from - (use.t + use.u)), hi, at: mid })
	}
}

export const observe = (entry: Entry, remaining: number, now: number, sends: readonly Send[]): Change => {
	entry.peak = Math.max(entry.peak, remaining)
	if (entry.last === null) {
		entry.last = remaining
		entry.lastAt = now
		return { drop: 0, rise: 0 }
	}
	const delta = remaining - entry.last
	const half = Math.max(0, now - entry.lastAt) / 2
	const mid = entry.lastAt + half
	if (delta < 0) {
		const added = attribute(Math.min(-delta, TUNING.maxUses), entry, now, sends, mid, half)
		entry.uses.push(...added)
		entry.history.push(...added.map((use) => use.t))
	}
	if (delta > 0) refill(entry, delta, mid, half)
	const outstanding = Math.max(0, entry.peak - remaining)
	if (entry.uses.length > outstanding) entry.uses.splice(0, entry.uses.length - outstanding)
	entry.uses = entry.uses.filter((use) => now - use.t <= TUNING.maxAge).slice(-TUNING.maxUses)
	entry.samples = entry.samples.slice(-TUNING.maxSamples)
	entry.history = entry.history.filter((time) => now - time <= TUNING.historyAge).slice(-TUNING.maxHistory)
	entry.batches = entry.batches.slice(-TUNING.maxBatches)
	entry.last = remaining
	entry.lastAt = now
	return { drop: Math.max(0, -delta), rise: Math.max(0, delta) }
}

const resetCycle = (entry: Entry): { period: number; spread: number; count: number } | null => {
	if (entry.batches.length < 3) return null
	const periods = entry.batches.slice(1).map((batch, index) => batch.t - entry.batches[index]!.t)
	const period = median(periods)
	const spread = Math.max(1.4826 * median(periods.map((value) => Math.abs(value - period))), period * 0.01)
	return { period, spread, count: periods.length }
}

export const forecast = (entry: Entry, { now, prior, serverReset }: ForecastInput, cached?: WindowEstimate): Forecast | null => {
	if (serverReset && serverReset > now) {
		return { source: 'server', regime: 'server', next: serverReset, full: serverReset, anchor: now, progress: 0, confidence: 1, samples: 0, overdue: false, margin: 0, complete: true }
	}
	const estimate = cached ?? estimateWindow(entry.samples, prior, ESTIMATOR)
	const cycle = resetCycle(entry)
	const noisy = estimate.samples < 3 || estimate.coverage < 0.5
	if (cycle && cycle.spread / cycle.period <= 0.15 && noisy) {
		if (entry.last !== null && entry.last >= entry.peak) return null
		const anchor = entry.batches[entry.batches.length - 1]!.t
		const next = anchor + cycle.period
		const overdue = next <= now
		const progress = overdue ? 1 : Math.max(0, Math.min(1, (now - anchor) / cycle.period))
		const confidence = Math.max(0, Math.min(1, (cycle.count / (cycle.count + 2)) / (1 + (3 * cycle.spread) / cycle.period)))
		return { source: 'learned', regime: 'reset', next, full: next, anchor, progress, confidence, samples: cycle.count, overdue, margin: 2 * cycle.spread, complete: true }
	}
	const first = entry.uses[0]
	const lastUse = entry.uses[entry.uses.length - 1]
	if (!first || !lastUse) return null
	const next = first.t + estimate.window
	const full = lastUse.t + estimate.window
	const overdue = next <= now
	const progress = overdue ? 1 : Math.max(0, Math.min(1, (now - first.t) / (next - first.t)))
	const complete = entry.last === null || entry.peak - entry.last <= entry.uses.length
	return { source: 'learned', regime: 'rolling', next, full, anchor: first.t, progress, confidence: estimate.confidence, samples: estimate.samples, overdue, margin: estimate.margin + first.u, complete }
}
