import { getText } from './http'
import type { Logger } from './logger'
import { Poller } from './poller'
import { retry } from './retry'
import type { Scope } from './scope'
import { isNewerVersion } from './semver'
import type { ScriptStorage } from './storage'

export interface AvailableUpdate {
	readonly version: string
	readonly current: string
}

export type CheckResult = 'available' | 'current' | 'skipped' | 'failed'

export interface UpdaterOptions {
	readonly metaUrl: string
	readonly current: string
	readonly storage: ScriptStorage
	readonly onAvailable: (update: AvailableUpdate) => void
	readonly onChange?: () => void
	readonly logger?: Logger
	readonly namespace?: string
	readonly interval?: number
	readonly startupDelay?: number
	readonly startupMinGap?: number
	readonly fetchText?: (url: string) => Promise<string>
}

const DEFAULTS = { interval: 300_000, startupDelay: 1_500, startupMinGap: 20_000 } as const

export class Updater {
	latest: string | null
	error: Error | null = null
	private inflight: Promise<CheckResult> | null = null
	private readonly announced = new Set<string>()

	constructor(private readonly options: UpdaterOptions) {
		this.latest = options.storage.get<string | null>(this.key('latest'), null)
	}

	get checkedAt(): number {
		return this.options.storage.get(this.key('last-check'), 0)
	}

	get skipped(): string | null {
		return this.options.storage.get<string | null>(this.key('dismissed'), null)
	}

	get available(): string | null {
		return this.latest && isNewerVersion(this.latest, this.options.current) ? this.latest : null
	}

	get pending(): string | null {
		const version = this.available
		return version && version !== this.skipped ? version : null
	}

	start(scope: Scope): void {
		const interval = this.options.interval ?? DEFAULTS.interval
		this.evaluate(false)
		scope.timeout(() => void this.check(false, this.options.startupMinGap ?? DEFAULTS.startupMinGap), this.options.startupDelay ?? DEFAULTS.startupDelay)
		new Poller({
			task: async () => {
				if (Date.now() - this.checkedAt >= interval) await this.check(false)
			},
			interval,
			tick: Math.min(30_000, Math.max(1_000, interval / 4)),
			staleAfter: interval,
			onError: (error) => this.options.logger?.warning('Update poll failed.', error)
		}).start(scope)
	}

	skip(version: string | null = this.latest): void {
		if (!version) return
		this.options.storage.set(this.key('dismissed'), version)
		this.options.onChange?.()
	}

	unskip(): void {
		this.options.storage.remove(this.key('dismissed'))
		this.options.onChange?.()
	}

	check(manual = false, minGap = 0): Promise<CheckResult> {
		this.inflight ??= this.run(manual, minGap).finally(() => {
			this.inflight = null
		})
		return this.inflight
	}

	private async run(manual: boolean, minGap: number): Promise<CheckResult> {
		if (!manual && this.latest !== null && Date.now() - this.checkedAt < minGap) return this.evaluate(false)
		try {
			const fetchText = this.options.fetchText ?? ((url: string) => getText(url, 10_000))
			const meta = await retry(() => fetchText(`${this.options.metaUrl}?t=${Date.now()}`), { attempts: 2, delay: 800 })
			const latest = /@version\s+(\S+)/.exec(meta)?.[1]
			if (!latest) throw new Error('No version found in the published metadata.')
			this.latest = latest
			this.error = null
			this.options.storage.set(this.key('latest'), latest)
			this.options.storage.set(this.key('last-check'), Date.now())
		} catch (error) {
			this.error = error instanceof Error ? error : new Error(String(error))
			this.options.logger?.warning('Update check failed.', error)
			this.options.onChange?.()
			return 'failed'
		}
		this.options.onChange?.()
		return this.evaluate(manual)
	}

	private evaluate(manual: boolean): CheckResult {
		const version = this.available
		if (!version) return 'current'
		if (!manual && this.skipped === version) return 'skipped'
		if (manual || !this.announced.has(version)) {
			this.announced.add(version)
			this.options.onAvailable({ version, current: this.options.current })
		}
		return 'available'
	}

	private key(name: string): string {
		return `${this.options.namespace ?? 'updater'}:${name}`
	}
}
