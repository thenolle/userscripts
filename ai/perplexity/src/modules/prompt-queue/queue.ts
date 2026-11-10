import { storage } from '../../core/storage'

export interface KeyValueStore {
  get<T>(key: string, fallback: T): T
  set<T>(key: string, value: T): void
}

export interface QueueItem {
  readonly id: string
  readonly text: string
  readonly addedAt: number
  readonly thread: string | null
}

const KEY = 'prompt-queue:items'
const ROOT_PATH = /^\/(?:computer|spaces|library|discover)?\/?$/

export const MAX_ITEMS = 50
export const MAX_AGE = 24 * 3_600_000

export const threadOf = (pathname: string): string | null => (ROOT_PATH.test(pathname) ? null : pathname)

export class PromptQueue {
  private items: QueueItem[]
  private readonly listeners = new Set<() => void>()
  private counter = 0

  constructor(
    private readonly store: KeyValueStore = storage,
    private readonly now: () => number = Date.now
  ) {
    this.items = this.store.get<QueueItem[]>(KEY, []).filter((item) => this.now() - item.addedAt < MAX_AGE).slice(0, MAX_ITEMS)
  }

  get size(): number {
    return this.items.length
  }

  list(): readonly QueueItem[] {
    return this.items
  }

  peek(): QueueItem | undefined {
    return this.items[0]
  }

  add(text: string, thread: string | null): QueueItem | null {
    const clean = text.trim()
    if (!clean || this.items.length >= MAX_ITEMS) return null
    const item: QueueItem = { id: `q${this.now().toString(36)}${(this.counter++).toString(36)}`, text: clean, addedAt: this.now(), thread }
    this.items = [...this.items, item]
    this.commit()
    return item
  }

  update(id: string, text: string): void {
    const clean = text.trim()
    if (!clean) {
      this.remove(id)
      return
    }
    this.items = this.items.map((item) => (item.id === id ? { ...item, text: clean } : item))
    this.commit()
  }

  move(id: string, delta: number): void {
    const from = this.items.findIndex((item) => item.id === id)
    const to = Math.max(0, Math.min(this.items.length - 1, from + delta))
    if (from < 0 || from === to) return
    const next = [...this.items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved!)
    this.items = next
    this.commit()
  }

  retarget(thread: string | null): void {
    if (!this.items.length) return
    this.items = this.items.map((item) => ({ ...item, thread }))
    this.commit()
  }

  remove(id: string): void {
    const next = this.items.filter((item) => item.id !== id)
    if (next.length === this.items.length) return
    this.items = next
    this.commit()
  }

  clear(): void {
    if (!this.items.length) return
    this.items = []
    this.commit()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private commit(): void {
    this.store.set(KEY, this.items)
    for (const listener of this.listeners) listener()
  }
}

export const promptQueue = new PromptQueue()
