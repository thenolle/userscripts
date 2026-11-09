import { createLogger } from './logger'

type PageWindow = Window & typeof globalThis

const logger = createLogger('core')

export const getPageWindow = (): PageWindow | null => {
  if (typeof unsafeWindow !== 'undefined' && unsafeWindow) return unsafeWindow
  return (window as unknown as { wrappedJSObject?: PageWindow }).wrappedJSObject ?? null
}

export interface RawRequest {
  readonly url: string
  readonly method: string
  header(name: string): string | null
}

const readHeader = (headers: unknown, name: string): string | null => {
  if (!headers) return null
  if (typeof (headers as Headers).get === 'function') return (headers as Headers).get(name)
  if (Array.isArray(headers)) {
    const pair = headers.find((entry) => Array.isArray(entry) && String(entry[0]).toLowerCase() === name)
    return pair ? String(pair[1]) : null
  }
  if (typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
      if (key.toLowerCase() === name) return typeof value === 'string' ? value : null
    }
  }
  return null
}

const describeRequest = (input: unknown, init: unknown): RawRequest => {
  const request = input as { url?: string; href?: string; method?: string; headers?: unknown } | string | null
  const options = init as RequestInit | undefined
  const url = typeof request === 'string' ? request : (request?.url ?? request?.href ?? '')
  const method = (options?.method ?? (typeof request === 'object' ? request?.method : undefined) ?? 'GET').toUpperCase()
  return {
    url,
    method,
    header: (name) => readHeader(options?.headers, name.toLowerCase()) ?? readHeader(typeof request === 'object' ? request?.headers : null, name.toLowerCase())
  }
}

export class FetchSpy<T> {
  private readonly listeners = new Set<(request: T) => void>()
  private installed = false

  constructor(private readonly extract: (request: RawRequest) => T) {}

  subscribe(listener: (request: T) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  install(): void {
    if (this.installed) return
    const page = getPageWindow()
    if (!page || !page.fetch) {
      logger.warning('Page fetch is not reachable; request spying is disabled.')
      return
    }
    const original = page.fetch
    const notify = (request: T): void => {
      for (const listener of this.listeners) {
        try {
          listener(request)
        } catch (error) {
          logger.errorOnce('Fetch spy listener failed.', error)
        }
      }
    }
    const hooked = (...args: Parameters<typeof fetch>): Promise<Response> => {
      try {
        notify(this.extract(describeRequest(args[0], args[1])))
      } catch (error) {
        logger.errorOnce('Fetch spy failed.', error)
      }
      return original.apply(page, args)
    }
    const replacement = Object.assign(hooked, original)
    page.fetch = typeof exportFunction === 'function' ? exportFunction(replacement, page) : replacement
    this.installed = true
  }
}
