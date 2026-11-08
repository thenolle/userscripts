import { storage } from '../../core/storage'
import { estimateWindow, type EstimatorTuning, type Sample } from './estimator'
import type { Forecast, LimitKey } from './types'

interface TrackerEntry {
  last: number | null
  lastAt: number
  peak: number
  events: number[]
  samples: Sample[]
}

type TrackerState = Partial<Record<LimitKey, TrackerEntry>>

export interface ObserveContext {
  now: number
  sentAt: number
}

export interface ForecastContext {
  now: number
  prior: number
  bias: number
  serverReset: number | null
}

const STORAGE_PREFIX = 'usage-status:tracker'

const TUNING = {
  maxEvents: 600,
  maxSamples: 40,
  minSample: 60_000,
  maxAge: 45 * 86_400_000,
  sendTolerance: 120_000
} as const

const ESTIMATOR: EstimatorTuning = { halfLife: 10, priorWeight: 2, outlierSigma: 3 }

export class ResetTracker {
  private storageKey = `${STORAGE_PREFIX}:anonymous:none`
  private state: TrackerState = storage.get<TrackerState>(this.storageKey, {})

  observe(key: LimitKey, remaining: number, { now, sentAt }: ObserveContext): void {
    const entry = (this.state[key] ??= { last: null, lastAt: 0, peak: 0, events: [], samples: [] })
    entry.peak = Math.max(entry.peak, remaining)
    if (entry.last === null) {
      entry.last = remaining
      entry.lastAt = now
      this.save()
      return
    }
    const delta = remaining - entry.last
    if (delta < 0) {
      const recent = sentAt > 0 && now - sentAt <= TUNING.sendTolerance && sentAt >= entry.lastAt - TUNING.sendTolerance
      const stamp = recent ? sentAt : now
      for (let index = 0; index < Math.min(-delta, TUNING.maxEvents); index++) entry.events.push(stamp)
    }
    if (delta > 0) {
      for (const stamp of entry.events.splice(0, delta)) {
        const value = now - stamp
        if (value >= TUNING.minSample) entry.samples.push({ value, at: now })
      }
      if (remaining >= entry.peak) entry.events.length = 0
    }
    entry.events = entry.events.filter((stamp) => now - stamp <= TUNING.maxAge)
    const outstanding = Math.max(0, entry.peak - remaining)
    if (entry.events.length > outstanding) entry.events.splice(0, entry.events.length - outstanding)
    entry.events.splice(0, Math.max(0, entry.events.length - TUNING.maxEvents))
    entry.samples = entry.samples.slice(-TUNING.maxSamples)
    entry.last = remaining
    entry.lastAt = now
    this.save()
  }

  peak(key: LimitKey): number | null {
    return this.state[key]?.peak || null
  }

  forecast(key: LimitKey, { now, prior, bias, serverReset }: ForecastContext): Forecast | null {
    if (serverReset && serverReset > now) return { source: 'server', next: serverReset, full: serverReset, anchor: now, progress: 0, confidence: 1, samples: 0, overdue: false }
    const entry = this.state[key]
    if (!entry?.events.length) return null
    const estimate = estimateWindow(entry.samples, prior, bias, ESTIMATOR)
    const anchor = entry.events[0]!
    const next = anchor + estimate.window
    const full = entry.events[entry.events.length - 1]! + estimate.window
    const overdue = next <= now
    const progress = overdue ? 1 : Math.max(0, Math.min(1, (now - anchor) / (next - anchor)))
    return { source: 'learned', next, full, anchor, progress, confidence: estimate.confidence, samples: estimate.samples, overdue }
  }

  bind(namespace: string): void {
    const key = `${STORAGE_PREFIX}:${namespace}`
    if (key === this.storageKey) return
    this.storageKey = key
    this.state = storage.get<TrackerState>(key, {})
  }

  reset(): void {
    this.state = {}
    this.save()
  }

  private save(): void {
    storage.set(this.storageKey, this.state)
  }
}