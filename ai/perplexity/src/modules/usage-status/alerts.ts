import { notify, notifyPermission } from '@nolly/core'
import { storage } from '../../core/storage'
import { showToast } from '../../ui/toast'
import { LIMITS, LIMIT_KEYS } from './definitions'
import type { UsageService } from './service'
import type { LimitKey } from './types'

const ENABLED = 'usage-alerts:enabled'
const SNAPSHOT = 'usage-alerts:snapshot'
const LOW_SENT = 'usage-alerts:low-sent'
const LOW_RATIO = 0.1
const CLAIM_WINDOW = 120_000

type Snapshot = Partial<Record<LimitKey, number>>

export class UsageAlerts {
	private snapshot: Snapshot = storage.get<Snapshot>(SNAPSHOT, {})
	private lowSent: Partial<Record<LimitKey, boolean>> = storage.get<Partial<Record<LimitKey, boolean>>>(LOW_SENT, {})
	private seenFetch = 0

	constructor(
		private readonly service: UsageService,
		private readonly openDetails: () => void
	) { }

	get enabled(): boolean {
		return storage.get(ENABLED, true)
	}

	set enabled(value: boolean) {
		storage.set(ENABLED, value)
	}

	wantsBackground(): boolean {
		return this.enabled && notifyPermission() === 'granted' && LIMIT_KEYS.some((key) => this.service.getRemaining(key) === 0)
	}

	check(): void {
		const { lastFetchedAt, rate } = this.service
		if (!rate || lastFetchedAt === this.seenFetch) return
		this.seenFetch = lastFetchedAt
		const next: Snapshot = { ...this.snapshot }
		for (const key of LIMIT_KEYS) {
			const value = this.service.getRemaining(key)
			if (value === null) continue
			const previous = this.snapshot[key]
			if (this.enabled && previous !== undefined) this.compare(key, previous, value)
			next[key] = value
		}
		this.snapshot = next
		storage.set(SNAPSHOT, next)
		storage.set(LOW_SENT, this.lowSent)
	}

	private compare(key: LimitKey, previous: number, value: number): void {
		const label = LIMITS[key].label
		if (previous <= 0 && value > 0 && this.claim(`refill:${key}`)) {
			this.lowSent[key] = false
			this.announce(`${label} is available again`, `${value} left.`, true)
		}
		if (value === 0 && previous > 0 && this.claim(`empty:${key}`)) this.announce(`${label} is used up`, this.service.formatForecast(key), false)
		const total = this.service.resolveTotal(key)
		if (!total) return
		const threshold = Math.max(1, Math.ceil(total * LOW_RATIO))
		if (value > threshold) {
			this.lowSent[key] = false
		} else if (previous > threshold && value > 0 && !this.lowSent[key] && this.claim(`low:${key}`)) {
			this.lowSent[key] = true
			this.announce(`${label} is running low`, `${value} left.`, false)
		}
	}

	private claim(id: string): boolean {
		const name = `usage-alerts:sent:${id}`
		if (Date.now() - storage.get<number>(name, 0) < CLAIM_WINDOW) return false
		storage.set(name, Date.now())
		return true
	}

	private announce(title: string, body: string, desktop: boolean): void {
		const away = document.visibilityState === 'hidden' || !document.hasFocus()
		if (away && desktop && notify(title, { body, tag: title, onClick: this.openDetails })) return
		if (document.visibilityState === 'hidden') return
		showToast(`${title}. ${body}`, [{ label: 'Details', onClick: this.openDetails }], 10_000)
	}
}
