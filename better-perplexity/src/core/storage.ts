const PREFIX = 'better-perplexity:'
const hasGm = typeof GM_getValue === 'function' && typeof GM_setValue === 'function'

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (hasGm) return GM_getValue<T>(key, fallback)
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T): void {
    if (hasGm) {
      GM_setValue<T>(key, value)
      return
    }
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      return
    }
  }
}