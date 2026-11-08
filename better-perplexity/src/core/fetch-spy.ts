import { logger } from './logger'
import { getPageWindow } from './page-window'

export interface SpiedRequest {
  readonly url: string
  readonly method: string
  readonly accountId: string | null
}

type Listener = (request: SpiedRequest) => void

const ACCOUNT_HEADER = 'x-pplx-account'

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

const describe = (input: unknown, init: unknown): SpiedRequest => {
  const request = input as { url?: string; href?: string; method?: string; headers?: unknown } | string | null
  const options = init as RequestInit | undefined
  const url = typeof request === 'string' ? request : (request?.url ?? request?.href ?? '')
  const method = options?.method ?? (typeof request === 'object' ? request?.method : undefined) ?? 'GET'
  const accountId = readHeader(options?.headers, ACCOUNT_HEADER) ?? readHeader(typeof request === 'object' ? request?.headers : null, ACCOUNT_HEADER)
  return { url, method: method.toUpperCase(), accountId }
}

export class FetchSpy {
  private readonly listeners = new Set<Listener>()
  private installed = false

  subscribe(listener: Listener): () => void {
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
    const notify = (request: SpiedRequest): void => {
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
        notify(describe(args[0], args[1]))
      } catch (error) {
        logger.errorOnce('Fetch spy failed.', error)
      }
      return original.apply(page, args)
    }
    const replacement = Object.assign(hooked, original)
    page.fetch = typeof exportFunction === 'function' ? exportFunction(replacement, page) : replacement
    this.installed = true
    logger.success('Page fetch observer installed.')
  }
}

export const fetchSpy = new FetchSpy()