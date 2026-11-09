import { CONFIG } from '../../config'
import { getElement } from '@nolly/core'
import { logger } from '../../core/logger'
import { HEADER } from '../../selectors'
import { UsageApi } from './api'
import { findCap } from './caps'
import { LIMITS, LIMIT_KEYS } from './definitions'
import { formatDuration, getStatus } from './format'
import { ModeDetector } from './mode'
import { resolvePlan } from './plan'
import { findResetTimestamp } from './server-reset'
import { ResetTracker } from './tracker'
import type { ActiveUsage, ApiDiagnostics, Forecast, FreeQueriesInfo, LimitKey, Plan, RateLimitResponse, SettingsResponse } from './types'

type Listener = () => void

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
  private readonly listeners = new Set<Listener>()

  constructor(
    private readonly api = new UsageApi(),
    private readonly tracker = new ResetTracker(),
    private readonly modes = new ModeDetector()
  ) { }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  markSent(): void {
    this.lastSentAt = Date.now()
  }

  shouldAutoFetch(): boolean {
    return !this.initialized && !this.fetching && Date.now() - this.lastAttemptAt > CONFIG.usage.retryCooldown
  }

  resetLearning(): void {
    this.tracker.reset()
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
    const pageSignedIn = Boolean(getElement(HEADER.avatar))
    return pageSignedIn ? 'Perplexity reports no subscription tier or status for this session, even though the page looks signed in. Open "Raw API data" to see which request variants were tried.' : 'Not signed in: Perplexity returned anonymous limits. Sign in to see your plan.'
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
    return this.tracker.forecast(key, {
      now: Date.now(),
      prior: LIMITS[key].window,
      bias: CONFIG.usage.refreshInterval / 2,
      serverReset: findResetTimestamp(this.rate)
    })
  }

  formatForecast(key: LimitKey | null): string {
    if (!key) return 'No limit tracked for this mode'
    const remaining = this.getRemaining(key)
    if (remaining === null) return 'Reset time unavailable'
    const forecast = this.getForecast(key)
    if (!forecast) {
      const total = this.resolveTotal(key)
      return total && remaining >= total ? 'Full allowance available' : 'Learning: needs a use and a refill to measure'
    }
    if (forecast.source === 'server') return `Resets in ${formatDuration(forecast.next - Date.now())}`
    const confidence = `${Math.round(forecast.confidence * 100)}% conf.`
    if (forecast.overdue) return `Next unit due any moment · ${confidence}`
    const now = Date.now()
    return `Next +1 in ${formatDuration(forecast.next - now)} · full in ${formatDuration(forecast.full - now)} · ${confidence}`
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

  getActive(): ActiveUsage | null {
    const mode = this.modes.detect()
    if (!mode) return null
    const remaining = this.getRemaining(mode.key)
    const total = this.resolveTotal(mode.key)
    const freeFallback = mode.key === 'remaining_pro' && remaining === 0 && Boolean(this.getFreeQueries()?.available) && this.getPlan() !== 'paid'
    return {
      ...mode,
      remaining,
      total,
      freeFallback,
      period: mode.key ? LIMITS[mode.key].period : 'Unknown',
      reset: this.formatForecast(mode.key),
      status: freeFallback ? 'low' : getStatus(remaining, total)
    }
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
      if (typeof value === 'number' && Number.isFinite(value)) this.tracker.observe(key, value, { now, sentAt: this.lastSentAt })
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