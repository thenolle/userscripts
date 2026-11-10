import { CONFIG } from '../../config'
import { logger } from '../../core/logger'
import { storage } from '../../core/storage'
import { hasSignInPrompt } from '../../locate'
import { UsageApi } from './api'
import { findCap } from './caps'
import { LIMITS, LIMIT_KEYS } from './definitions'
import { formatDuration, getStatus } from './format'
import { ModeDetector } from './mode'
import type { Send } from './model'
import { resolvePlan } from './plan'
import { findResetTimestamp } from './server-reset'
import { ResetTracker } from './tracker'
import type { ActiveUsage, ApiDiagnostics, Forecast, FreeQueriesInfo, LimitKey, Plan, RateLimitResponse, SettingsResponse, Pace } from './types'

type Listener = () => void

const SENDS_KEY = 'usage-status:sends'
const LAST_KEY = 'usage-status:last-key'
const SEND_TTL = 14 * 86_400_000
const MAX_SENDS = 50
const LEARN_WINDOW = 120_000
const DEDUPE_WINDOW = 1_500

const loadSends = (): Send[] => {
	const now = Date.now()
	const stored = storage.get<Send[]>(SENDS_KEY, [])
	if (!Array.isArray(stored)) return []
	return stored.filter((send) => typeof send?.at === 'number' && now - send.at <= SEND_TTL).slice(-MAX_SENDS)
}

export class UsageService {
	rate: RateLimitResponse | null = null
	settings: SettingsResponse | null = null
	diagnostics: ApiDiagnostics | null = null
	lastError: Error | null = null
	lastFetchedAt = 0
	lastSentAt = 0
	fetching = false
	initialized = false

	private lastAttemptAt = 0
	private sends: Send[] = loadSends()
	private lastUsedKey: LimitKey | null = storage.get<LimitKey | null>(LAST_KEY, null)
	private readonly listeners = new Set<Listener>()

	constructor(
		private readonly api = new UsageApi(),
		private readonly tracker = new ResetTracker(),
		private readonly modes = new ModeDetector()
	) {
		this.modes.setFallback(() => this.lastUsedKey)
	}

	subscribe(listener: Listener): () => void {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	noteSend(at = Date.now(), confirmed = false): void {
		this.lastSentAt = at
		const near = this.sends.findIndex((send) => Math.abs(send.at - at) < DEDUPE_WINDOW)
		if (near >= 0) {
			const existing = this.sends[near]!
			if (!confirmed || existing.confirmed) return
			this.sends[near] = { at: existing.at, confirmed: true }
		} else {
			this.sends = [...this.sends.filter((send) => at - send.at <= SEND_TTL), { at, confirmed }].slice(-MAX_SENDS)
		}
		storage.set(SENDS_KEY, this.sends)
	}

	markSent(): void {
		this.noteSend(Date.now(), false)
	}

	shouldAutoFetch(): boolean {
		return !this.initialized && !this.fetching && Date.now() - this.lastAttemptAt > CONFIG.usage.retryCooldown
	}

	refreshIfStale(maxAge: number): void {
		if (!this.fetching && Date.now() - this.lastFetchedAt >= maxAge) void this.refresh()
	}

	pollIfDue(allowHidden = false, now = Date.now()): void {
		if (this.fetching || (document.visibilityState === 'hidden' && !allowHidden)) return
		if (now - this.lastFetchedAt >= this.pollInterval(now)) void this.refresh()
	}

	resetLearning(): void {
		this.tracker.reset()
		this.sends = []
		this.lastUsedKey = null
		storage.set(SENDS_KEY, this.sends)
		storage.set(LAST_KEY, null)
		this.emit()
	}

	setAccountId(id: string, source: 'captured' | 'session' | 'manual'): void {
		this.api.setAccountId(id, source)
	}

	async refresh(): Promise<void> {
		if (this.fetching) return
		this.fetching = true
		this.lastError = null
		this.lastAttemptAt = Date.now()
		this.emit()
		try {
			const { rate, settings, diagnostics } = await this.api.fetchAll()
			this.rate = rate
			this.settings = settings
			this.diagnostics = diagnostics
			this.initialized = true
			this.lastFetchedAt = Date.now()
			if (settings) this.tracker.bind(this.namespace())
			if (rate) this.observe(rate)
			logger.success(`Usage data refreshed (${diagnostics.chosen ?? 'no variant authenticated'}).`)
		} catch (error) {
			this.lastError = error instanceof Error ? error : new Error(String(error))
			logger.error('Could not refresh usage data.', error)
		} finally {
			this.fetching = false
			this.emit()
		}
	}

	getPlan(): Plan {
		return resolvePlan(this.settings).plan
	}

	formatPlan(): string {
		return resolvePlan(this.settings).label
	}

	getNotice(): string | null {
		if (!this.initialized || this.getPlan() !== 'free') return null
		return hasSignInPrompt()
			? 'Not signed in: Perplexity returned anonymous limits. Sign in to see your plan.'
			: 'Perplexity reports no subscription tier or status for this session, even though the page looks signed in. Open "Raw API data" to see which request variants were tried.'
	}

	getRemaining(key: LimitKey | null): number | null {
		if (!key || !this.rate) return null
		const value = this.rate[key]
		return typeof value === 'number' && Number.isFinite(value) ? value : null
	}

	resolveTotal(key: LimitKey | null): number | null {
		if (!key) return null
		return findCap(this.rate, key) ?? (Math.max(LIMITS[key].total ?? 0, this.tracker.peak(key) ?? 0) || null)
	}

	totalSource(key: LimitKey | null): 'api' | 'configured' | 'learned' | null {
		if (!key) return null
		if (findCap(this.rate, key) !== null) return 'api'
		const configured = LIMITS[key].total ?? 0
		const peak = this.tracker.peak(key) ?? 0
		if (peak > configured) return 'learned'
		return configured > 0 ? 'configured' : null
	}

	formatTotal(key: LimitKey | null): string | null {
		const total = this.resolveTotal(key)
		if (total === null) return null
		return this.totalSource(key) === 'learned' ? `≥${total}` : String(total)
	}

	getForecast(key: LimitKey | null): Forecast | null {
		if (!key) return null
		const now = Date.now()
		const result = this.tracker.forecast(key, {
			now,
			prior: LIMITS[key].window,
			serverReset: findResetTimestamp(this.rate, key)
		})
		if (!result) return null
		if (result.source === 'server') return result
		if (result.samples < 3 || result.confidence < 0.2) return null
		if (result.next <= now) return null
		return result
	}

	formatForecast(key: LimitKey | null): string {
		if (!key) return 'No limit tracked for this mode'
		const remaining = this.getRemaining(key)
		if (remaining === null) return 'Reset time unavailable'
		const forecast = this.getForecast(key)
		if (!forecast) {
			const total = this.resolveTotal(key)
			return total && remaining >= total ? 'Full allowance available' : 'Refill time unconfirmed · collecting matched uses and refills'
		}
		const now = Date.now()
		if (forecast.source === 'server') return `Resets in ${formatDuration(forecast.next - now)}`
		const confidence = `${Math.round(forecast.confidence * 100)}% conf.`
		if (forecast.overdue) return 'Refill estimate expired · waiting for a confirmed increase'
		const margin = forecast.margin >= 60_000 ? ` ±${formatDuration(forecast.margin)}` : ''
		if (forecast.regime === 'reset') return `Full reset in ${formatDuration(forecast.next - now)}${margin} · ${confidence}`
		const lead = forecast.complete ? 'Next +1 in' : 'Next +1 within'
		return `${lead} ${formatDuration(forecast.next - now)}${margin} · full in ${formatDuration(forecast.full - now)} · ${confidence}`
	}

	getFreeQueries(): FreeQueriesInfo | null {
		const free = this.rate?.free_queries
		if (!free || typeof free !== 'object') return null
		const detail = free.remaining_detail
		const count = [detail?.remaining, detail?.count].find((value): value is number => typeof value === 'number') ?? null
		return { available: Boolean(free.available), count, kind: detail?.kind ?? null }
	}

	formatFreeQueries(): string {
		const free = this.getFreeQueries()
		if (!free) return '—'
		if (!free.available) return 'Unavailable'
		return free.count !== null ? String(free.count) : 'Available'
	}

	getActive(): ActiveUsage {
		const mode = this.modes.detect()
		const remaining = this.getRemaining(mode.key)
		const total = this.resolveTotal(mode.key)
		const freeFallback = mode.key === 'remaining_pro' && remaining === 0 && Boolean(this.getFreeQueries()?.available) && this.getPlan() !== 'paid'
		const assumed = mode.source === 'learned' || mode.source === 'default'
		return {
			...mode,
			label: assumed ? `${mode.label} (assumed)` : mode.label,
			remaining,
			total,
			freeFallback,
			period: mode.key ? LIMITS[mode.key].period : 'Unknown',
			reset: this.formatForecast(mode.key),
			status: freeFallback ? 'low' : getStatus(remaining, total)
		}
	}

	getPace(key: LimitKey | null): Pace | null {
		const remaining = this.getRemaining(key)
		if (!key || remaining === null) return null
		const now = Date.now()
		const day = 86_400_000
		const recent = this.tracker.history(key)
			.filter((time) => Number.isFinite(time) && time <= now && now - time <= 7 * day)
		if (recent.length < 10) return null
		const span = now - Math.min(...recent)
		if (span < day) return null
		const days = Math.min(7, span / day)
		const perDay = recent.length / days
		return {
			perDay,
			days,
			emptyInMs: remaining > 0 && days >= 3 ? remaining / perDay * day : null
		}
	}

	formatPace(key: LimitKey | null): string | null {
		const pace = this.getPace(key)
		if (!pace) return null
		const rate = pace.perDay >= 10 ? String(Math.round(pace.perDay)) : pace.perDay.toFixed(1)
		const remaining = this.getRemaining(key)
		const tail = remaining === 0
			? ' · no units remaining'
			: pace.emptyInMs === null
				? ' · more history needed for a depletion estimate'
				: ` · roughly ${formatDuration(pace.emptyInMs)} at that rate, excluding refills`
		return `Observed counter use: ~${rate} units/day over ${pace.days.toFixed(1)}d${tail}`
	}

	private pollInterval(now: number): number {
		const span = CONFIG.usage.focusSpan
		const expected = LIMIT_KEYS.some((key) => {
			const forecast = this.getForecast(key)
			if (!forecast || forecast.source === 'server') return false
			const distance = forecast.next - now
			return distance <= Math.min(2 * forecast.margin + 60_000, span) && distance >= -span
		})
		return expected ? CONFIG.usage.focusInterval : CONFIG.usage.refreshInterval
	}

	private namespace(): string {
		const referral = typeof this.settings?.['referral_code'] === 'string' && this.settings['referral_code'] ? this.settings['referral_code'] : null
		const account = this.api.currentAccountId ?? referral ?? 'default'
		const tier = typeof this.settings?.['subscription_tier'] === 'string' && this.settings['subscription_tier'] ? this.settings['subscription_tier'].toLowerCase() : 'none'
		return `${account}:${tier}`
	}

	private observe(rate: RateLimitResponse): void {
		const now = Date.now()
		for (const key of LIMIT_KEYS) {
			const value = rate[key]
			if (typeof value !== 'number' || !Number.isFinite(value)) continue
			const { drop } = this.tracker.observe(key, value, now, this.sends)
			if (drop > 0 && now - this.lastSentAt < LEARN_WINDOW) {
				this.lastUsedKey = key
				storage.set(LAST_KEY, key)
			}
		}
	}

	private emit(): void {
		for (const listener of this.listeners) {
			try {
				listener()
			} catch (error) {
				logger.errorOnce('Usage listener failed.', error)
			}
		}
	}
}
