import { SseParser } from '@nolly/ai'
import type { ResponseEvent, ResponseSpy } from '@nolly/ai'
import { ENDPOINTS, pathOf } from './endpoints'
import { parseFileLimitMb, parseJson, parseLimits, parseUsage } from './payloads'
import type { LimitProgress, UsageSnapshot } from './payloads'
import { interpret } from './stream'
import type { ChatEvent } from './stream'
import { QuotaLedger } from '@nolly/ai'
import { storage } from './storage'
import type { QuotaReport } from '@nolly/ai'

export type SessionEvent = 'generation-start' | 'generation-end' | 'conversation' | 'model' | 'limits' | 'usage' | 'plan' | 'user-message'

export class ChatSession {
	generating = false
	conversationId: string | null = null
	lastUserMessage: string | null = null
	model: string | null = null
	experience: string | null = null
	plan: string | null = null
	maxFileMb: number | null = null
	usage: UsageSnapshot | null = null

	private readonly limitMap = new Map<string, LimitProgress>()
	private readonly listeners = new Set<(event: SessionEvent) => void>()
	private readonly quotaLedger = new QuotaLedger(storage)
	private parser = new SseParser()

	constructor(spy: ResponseSpy) {
		spy.subscribe((event) => this.handle(event))
	}

	get limits(): LimitProgress[] {
		return [...this.limitMap.values()]
	}

	limit(feature: string): LimitProgress | null {
		return this.limitMap.get(feature) ?? null
	}

	subscribe(listener: (event: SessionEvent) => void): () => void {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	snapshot(): Record<string, unknown> {
		return {
			generating: this.generating,
			conversationId: this.conversationId,
			model: this.model,
			experience: this.experience,
			plan: this.plan,
			maxFileMb: this.maxFileMb,
			usage: this.usage,
			limits: this.limits
		}
	}

	getQuotaReports(): QuotaReport[] {
		return this.quotaLedger.reports(Date.now(), `chatgpt:${this.plan ?? 'unidentified'}`)
	}

	private emit(event: SessionEvent): void {
		for (const listener of this.listeners) {
			try {
				listener(event)
			} catch { }
		}
	}

	private mergeLimits(limits: readonly LimitProgress[]): void {
		const now = Date.now()
		for (const limit of limits) {
			this.limitMap.set(limit.feature, limit)
			const resetAt = limit.resetAfter ? Date.parse(limit.resetAfter) : Number.NaN
			this.quotaLedger.observe(`chatgpt:${this.plan ?? 'unidentified'}`, limit.feature, limit.feature.replace(/_/g, ' '), limit.remaining, null, Number.isFinite(resetAt) ? resetAt : null, now)
		}
		this.emit('limits')
	}

	private setPlan(plan: string | null): void {
		if (!plan || plan === this.plan) return
		this.plan = plan
		this.emit('plan')
	}

	private handle(event: ResponseEvent): void {
		const path = pathOf(event.url)
		if (path === ENDPOINTS.send) {
			this.handleSend(event)
			return
		}
		if (event.type !== 'body') return
		const json = parseJson(event.text)
		if (path === ENDPOINTS.init) {
			this.mergeLimits(parseLimits(json))
			this.maxFileMb = parseFileLimitMb(json) ?? this.maxFileMb
		} else if (path === ENDPOINTS.usage) {
			this.usage = parseUsage(json)
			this.setPlan(this.usage?.plan ?? null)
			this.emit('usage')
		}
	}

	private handleSend(event: ResponseEvent): void {
		if (event.type === 'start') {
			this.parser = new SseParser()
			this.generating = true
			this.emit('generation-start')
		} else if (event.type === 'chunk') {
			for (const message of this.parser.push(event.text)) for (const chat of interpret(message)) this.apply(chat)
		} else if (event.type === 'end') {
			this.generating = false
			this.emit('generation-end')
		}
	}

	private apply(event: ChatEvent): void {
		switch (event.type) {
			case 'conversation':
				this.conversationId = event.id
				this.emit('conversation')
				break
			case 'user-message':
				this.lastUserMessage = event.text
				this.emit('user-message')
				break
			case 'model':
				this.model = event.slug ?? this.model
				this.experience = event.experience ?? this.experience
				this.setPlan(event.plan)
				this.emit('model')
				break
			case 'limits':
				this.mergeLimits(event.limits)
				break
			case 'complete':
				break
		}
	}
}
