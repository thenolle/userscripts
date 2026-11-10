import { storage } from '../../platform'
import { fuzzyScore } from '../command-palette/fuzzy'
import type { KeyValueStore } from '../prompt-queue/queue'
import { uiConfig } from '../../ui/config'

export interface ThreadRef {
	readonly path: string
	readonly at: number
}

export interface HistoryEntry {
	readonly id: string
	readonly text: string
	readonly first: number
	readonly last: number
	readonly count: number
	readonly pinned: boolean
	readonly threads: readonly ThreadRef[]
}

export type HistoryFilter = 'all' | 'pinned' | 'today' | 'here'

export interface SearchContext {
	readonly path: string
	readonly now: number
}

export interface ImportResult {
	readonly added: number
	readonly merged: number
	readonly skipped: number
}

export const MAX_ENTRIES = 2_000
export const MAX_TEXT = 20_000
export const MIN_TEXT = 2
export const MAX_THREADS = 5

const KEY = 'recall:entries'
const DAY = 86_400_000

const normalize = (text: string): string => text.replace(/\s+/g, ' ').trim().toLowerCase()

export const hashText = (text: string): string => {
	const normal = normalize(text)
	let hash = 0x811c9dc5
	for (const char of normal) {
		hash ^= char.codePointAt(0)!
		hash = Math.imul(hash, 0x01000193) >>> 0
	}
	return `${hash.toString(16).padStart(8, '0')}${normal.length.toString(36)}`
}

export const matchScore = (query: string, text: string): number => {
	const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
	if (!tokens.length) return 1
	const haystack = text.toLowerCase()
	let score = 0
	for (const token of tokens) {
		const index = haystack.indexOf(token)
		if (index === -1) return Math.min(fuzzyScore(query, text.slice(0, 300)), 9) * 0.1
		const boundary = index === 0 || /[\s\-_:.,;()[\]"']/.test(haystack[index - 1] ?? '')
		score += 10 + (boundary ? 5 : 0) - Math.min(index, 200) / 100
	}
	return score
}

const sanitize = (raw: unknown): HistoryEntry | null => {
	if (!raw || typeof raw !== 'object') return null
	const row = raw as Record<string, unknown>
	const text = typeof row['text'] === 'string' ? row['text'].trim().slice(0, MAX_TEXT) : ''
	if (text.length < MIN_TEXT) return null
	const number = (value: unknown, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)
	const last = number(row['last'], Date.now())
	const threads = Array.isArray(row['threads']) ? row['threads'].flatMap((thread): ThreadRef[] => {
		const ref = thread as Record<string, unknown> | null
		return ref && typeof ref['path'] === 'string' ? [{ path: ref['path'], at: number(ref['at'], last) }] : []
	}) : []
	return { id: hashText(text), text, first: number(row['first'], last), last, count: Math.max(1, Math.round(number(row['count'], 1))), pinned: row['pinned'] === true, threads: threads.slice(0, MAX_THREADS) }
}

export class HistoryStore {
	private entries: Map<string, HistoryEntry>
	private readonly listeners = new Set<() => void>()

	constructor(
		private readonly store: KeyValueStore = storage,
		private readonly now: () => number = Date.now
	) {
		this.entries = new Map()
		for (const raw of this.store.get<unknown[]>(KEY, [])) {
			const entry = sanitize(raw)
			if (entry) this.entries.set(entry.id, entry)
		}
	}

	get size(): number {
		return this.entries.size
	}

	get(id: string): HistoryEntry | undefined {
		return this.entries.get(id)
	}

	record(text: string, path: string | null): HistoryEntry | null {
		const clean = text.trim().slice(0, MAX_TEXT)
		if (clean.length < MIN_TEXT) return null
		const id = hashText(clean)
		const now = this.now()
		const existing = this.entries.get(id)
		const threads = path ? [{ path, at: now }, ...(existing?.threads ?? []).filter((thread) => thread.path !== path)].slice(0, MAX_THREADS) : (existing?.threads ?? [])
		const entry: HistoryEntry = existing ? { ...existing, last: now, count: existing.count + 1, threads } : { id, text: clean, first: now, last: now, count: 1, pinned: false, threads }
		this.entries.set(id, entry)
		this.trim()
		this.commit()
		return entry
	}

	attach(id: string, path: string): void {
		const entry = this.entries.get(id)
		if (!entry || entry.threads.some((thread) => thread.path === path)) return
		this.entries.set(id, { ...entry, threads: [{ path, at: this.now() }, ...entry.threads].slice(0, MAX_THREADS) })
		this.commit()
	}

	recent(limit = 100): HistoryEntry[] {
		return [...this.entries.values()].sort((a, b) => b.last - a.last).slice(0, limit)
	}

	search(query: string, filter: HistoryFilter, { path, now }: SearchContext): HistoryEntry[] {
		const midnight = new Date(now).setHours(0, 0, 0, 0)
		const pool = [...this.entries.values()].filter((entry) => {
			if (filter === 'pinned') return entry.pinned
			if (filter === 'today') return entry.last >= midnight
			if (filter === 'here') return entry.threads.some((thread) => thread.path === path)
			return true
		})
		const q = query.trim()
		if (!q) return pool.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.last - a.last)
		return pool.map((entry) => ({ entry, base: matchScore(q, entry.text) })).filter(({ base }) => base > 0).map(({ entry, base }) => ({ entry, score: base + (entry.pinned ? 5 : 0) + 2 * Math.log10(entry.count + 1) + 3 / (1 + (now - entry.last) / (3 * DAY)) })).sort((a, b) => b.score - a.score).map(({ entry }) => entry)
	}

	togglePin(id: string): boolean | null {
		const entry = this.entries.get(id)
		if (!entry) return null
		this.entries.set(id, { ...entry, pinned: !entry.pinned })
		this.commit()
		return !entry.pinned
	}

	remove(id: string): void {
		if (this.entries.delete(id)) this.commit()
	}

	clear(keepPinned = true): void {
		for (const [id, entry] of this.entries) if (!keepPinned || !entry.pinned) this.entries.delete(id)
		this.commit()
	}

	prune(retentionDays: number): number {
		if (retentionDays <= 0) return 0
		const cutoff = this.now() - retentionDays * DAY
		let removed = 0
		for (const [id, entry] of this.entries) {
			if (!entry.pinned && entry.last < cutoff) {
				this.entries.delete(id)
				removed++
			}
		}
		if (removed) this.commit()
		return removed
	}

	exportJson(): string {
		return JSON.stringify({ app: uiConfig().id, kind: 'recall', version: 1, exportedAt: new Date(this.now()).toISOString(), entries: [...this.entries.values()] }, null, 2)
	}

	importJson(json: string): ImportResult {
		let parsed: unknown
		try {
			parsed = JSON.parse(json)
		} catch {
			return { added: 0, merged: 0, skipped: 0 }
		}
		const rows = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { entries?: unknown })?.entries) ? (parsed as { entries: unknown[] }).entries : []
		let added = 0
		let merged = 0
		let skipped = 0
		for (const raw of rows) {
			const incoming = sanitize(raw)
			if (!incoming) {
				skipped++
				continue
			}
			const existing = this.entries.get(incoming.id)
			if (!existing) {
				this.entries.set(incoming.id, incoming)
				added++
				continue
			}
			const seen = new Set(existing.threads.map((thread) => thread.path))
			this.entries.set(incoming.id, { ...existing, first: Math.min(existing.first, incoming.first), last: Math.max(existing.last, incoming.last), count: Math.max(existing.count, incoming.count), pinned: existing.pinned || incoming.pinned, threads: [...existing.threads, ...incoming.threads.filter((thread) => !seen.has(thread.path))].slice(0, MAX_THREADS) })
			merged++
		}
		this.trim()
		this.commit()
		return { added, merged, skipped }
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	private trim(): void {
		if (this.entries.size <= MAX_ENTRIES) return
		const droppable = [...this.entries.values()].filter((entry) => !entry.pinned).sort((a, b) => a.last - b.last)
		for (const entry of droppable.slice(0, this.entries.size - MAX_ENTRIES)) this.entries.delete(entry.id)
	}

	private commit(): void {
		this.store.set(KEY, [...this.entries.values()])
		for (const listener of this.listeners) listener()
	}
}
