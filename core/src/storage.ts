import type { Teardown } from './scope'

export interface StorageOptions {
  readonly namespace: string
  readonly gmPrefix?: string
}

export interface Bucket<T> {
  get(): T
  set(value: T): void
  update(updater: (current: T) => T): void
  reset(): void
  subscribe(listener: (value: T) => void): Teardown
}

type Listener = (value: unknown) => void

const hasGm = typeof GM_getValue === 'function' && typeof GM_setValue === 'function'

export class ScriptStorage {
  private readonly listeners = new Map<string, Set<Listener>>()

  constructor(private readonly options: StorageOptions) {}

  get<T>(key: string, fallback: T): T {
    if (hasGm) return GM_getValue<T>(this.gmKey(key), fallback)
    try {
      const raw = localStorage.getItem(this.localKey(key))
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  }

  set<T>(key: string, value: T): void {
    if (hasGm) {
      GM_setValue<T>(this.gmKey(key), value)
    } else {
      try {
        localStorage.setItem(this.localKey(key), JSON.stringify(value))
      } catch {
        return
      }
    }
    for (const listener of this.listeners.get(key) ?? []) listener(value)
  }

  remove(key: string): void {
    if (hasGm && typeof GM_deleteValue === 'function') GM_deleteValue(this.gmKey(key))
    else if (!hasGm) localStorage.removeItem(this.localKey(key))
  }

  subscribe<T>(key: string, listener: (value: T) => void): Teardown {
    const set = this.listeners.get(key) ?? new Set<Listener>()
    set.add(listener as Listener)
    this.listeners.set(key, set)
    return () => set.delete(listener as Listener)
  }

  bucket<T>(key: string, fallback: T): Bucket<T> {
    return {
      get: () => this.get(key, fallback),
      set: (value) => this.set(key, value),
      update: (updater) => this.set(key, updater(this.get(key, fallback))),
      reset: () => this.set(key, fallback),
      subscribe: (listener) => this.subscribe<T>(key, listener)
    }
  }

  private gmKey(key: string): string {
    return `${this.options.gmPrefix ?? ''}${key}`
  }

  private localKey(key: string): string {
    return `${this.options.namespace}:${key}`
  }
}

export const createStorage = (options: StorageOptions): ScriptStorage => new ScriptStorage(options)
