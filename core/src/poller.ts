import type { Scope } from './scope'

export interface PollerOptions {
	readonly task: () => void | Promise<void>
	readonly interval: number | (() => number)
	readonly tick?: number
	readonly staleAfter?: number
	readonly onError?: (error: unknown) => void
}

export class Poller {
	private timer = 0
	private running = false
	private lastRun = 0

	constructor(private readonly options: PollerOptions) { }

	get active(): boolean {
		return this.timer !== 0
	}

	start(scope?: Scope): this {
		if (this.timer) return this
		this.timer = window.setInterval(() => this.poll(), this.options.tick ?? 5_000)
		document.addEventListener('visibilitychange', this.onVisible)
		scope?.add(() => this.stop())
		return this
	}

	stop(): void {
		window.clearInterval(this.timer)
		this.timer = 0
		document.removeEventListener('visibilitychange', this.onVisible)
	}

	async trigger(): Promise<void> {
		if (this.running) return
		this.running = true
		this.lastRun = Date.now()
		try {
			await this.options.task()
		} catch (error) {
			this.options.onError?.(error)
		} finally {
			this.running = false
		}
	}

	private interval(): number {
		return typeof this.options.interval === 'function' ? this.options.interval() : this.options.interval
	}

	private poll(): void {
		if (document.visibilityState === 'hidden') return
		if (Date.now() - this.lastRun >= this.interval()) void this.trigger()
	}

	private readonly onVisible = (): void => {
		if (document.visibilityState !== 'visible') return
		if (Date.now() - this.lastRun >= (this.options.staleAfter ?? this.interval())) void this.trigger()
	}
}
