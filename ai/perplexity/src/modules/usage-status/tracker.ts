import { storage } from '../../core/storage'
import { estimateWindow, type WindowEstimate } from './estimator'
import { emptyEntry, ESTIMATOR, forecast, observe, type Change, type Entry, type ForecastInput, type Send } from './model'
import type { Forecast, LimitKey } from './types'

const PREFIX = 'usage-status:tracker'
const DEFAULT_NAMESPACE = 'anonymous:none'
const LEGACY_PAD = 60_000

type State = Partial<Record<LimitKey, Entry>>

interface LegacyEntry {
	last?: number | null
	lastAt?: number
	peak?: number
	events?: number[]
	samples?: { value: number; at: number }[]
}

const revive = (raw: Partial<Entry>): Entry => ({
	...emptyEntry(),
	...raw,
	uses: Array.isArray(raw.uses) ? raw.uses : [],
	history: Array.isArray(raw.history) ? raw.history : [],
	samples: Array.isArray(raw.samples) ? raw.samples : [],
	batches: Array.isArray(raw.batches) ? raw.batches : []
})

const migrate = (legacy: Record<string, LegacyEntry>): State => {
	const state: State = {}
	for (const [name, old] of Object.entries(legacy)) {
		state[name as LimitKey] = revive({
			last: old.last ?? null,
			lastAt: old.lastAt ?? 0,
			peak: old.peak ?? 0,
			uses: (old.events ?? []).map((t) => ({ t, u: LEGACY_PAD })),
			samples: (old.samples ?? []).map(({ value, at }) => ({ lo: Math.max(0, value - LEGACY_PAD), hi: value + LEGACY_PAD, at }))
		})
	}
	return state
}

export class ResetTracker {
	private namespace = DEFAULT_NAMESPACE
	private state: State = this.load(DEFAULT_NAMESPACE)
	private readonly cache = new Map<LimitKey, { signature: string; estimate: WindowEstimate }>()

	observe(key: LimitKey, remaining: number, now: number, sends: readonly Send[]): Change {
		const entry = (this.state[key] ??= emptyEntry())
		const change = observe(entry, remaining, now, sends)
		this.save()
		return change
	}

	peak(key: LimitKey): number | null {
		return this.state[key]?.peak || null
	}

	forecast(key: LimitKey, input: ForecastInput): Forecast | null {
		const entry = this.state[key]
		if (!entry) return null
		return forecast(entry, input, this.estimate(key, entry, input.prior))
	}

	bind(namespace: string): void {
		if (namespace === this.namespace) return
		this.namespace = namespace
		this.state = this.load(namespace)
		this.cache.clear()
	}

	reset(): void {
		this.state = {}
		this.cache.clear()
		this.save()
	}

	history(key: LimitKey): readonly number[] {
		return this.state[key]?.history ?? []
	}

	private estimate(key: LimitKey, entry: Entry, prior: number): WindowEstimate {
		const signature = `${prior}:${entry.samples.length}:${entry.samples[entry.samples.length - 1]?.at ?? 0}`
		const cached = this.cache.get(key)
		if (cached?.signature === signature) return cached.estimate
		const estimate = estimateWindow(entry.samples, prior, ESTIMATOR)
		this.cache.set(key, { signature, estimate })
		return estimate
	}

	private load(namespace: string): State {
		const current = storage.get<Record<string, Partial<Entry>> | null>(`${PREFIX}:v2:${namespace}`, null)
		if (current) return Object.fromEntries(Object.entries(current).map(([name, raw]) => [name, revive(raw)])) as State
		return migrate(storage.get<Record<string, LegacyEntry>>(`${PREFIX}:${namespace}`, {}))
	}

	private save(): void {
		storage.set(`${PREFIX}:v2:${this.namespace}`, this.state)
	}
}
