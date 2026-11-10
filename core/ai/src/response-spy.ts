import { createLogger, getPageWindow } from '@nolly/core'

const logger = createLogger('ai')

export type ResponseMode = 'stream' | 'body'

export type ResponseEvent =
  | { readonly type: 'start'; readonly url: string; readonly method: string; readonly status: number }
  | { readonly type: 'chunk'; readonly url: string; readonly text: string }
  | { readonly type: 'body'; readonly url: string; readonly text: string }
  | { readonly type: 'end'; readonly url: string; readonly ok: boolean }

export interface RequestInfo {
  readonly url: string
  readonly method: string
}

type Classifier = (request: RequestInfo) => ResponseMode | null

const describe = (input: unknown, init: unknown): RequestInfo => {
  const request = input as { url?: string; href?: string; method?: string } | string | null
  const options = init as RequestInit | undefined
  const url = typeof request === 'string' ? request : (request?.url ?? request?.href ?? '')
  const method = (options?.method ?? (typeof request === 'object' ? request?.method : undefined) ?? 'GET').toUpperCase()
  return { url, method }
}

export class ResponseSpy {
  private readonly listeners = new Set<(event: ResponseEvent) => void>()
  private installed = false

  constructor(private readonly classify: Classifier) {}

  subscribe(listener: (event: ResponseEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  install(): void {
    if (this.installed) return
    const page = getPageWindow()
    if (!page || !page.fetch) {
      logger.warning('Page fetch is not reachable; response spying is disabled.')
      return
    }
    const original = page.fetch
    const hooked = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const info = describe(args[0], args[1])
      const response = await original.apply(page, args)
      try {
        const mode = this.classify(info)
        if (mode) void this.tap(info, response.clone(), mode)
      } catch (error) {
        logger.errorOnce('Response spy failed.', error)
      }
      return response
    }
    const replacement = Object.assign(hooked, original)
    const expose = (globalThis as { exportFunction?: (fn: unknown, target: unknown) => typeof fetch }).exportFunction
    page.fetch = typeof expose === 'function' ? expose(replacement, page) : replacement
    this.installed = true
  }

  private emit(event: ResponseEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        logger.errorOnce('Response spy listener failed.', error)
      }
    }
  }

  private async tap(info: RequestInfo, response: Response, mode: ResponseMode): Promise<void> {
    this.emit({ type: 'start', url: info.url, method: info.method, status: response.status })
    try {
      if (mode === 'body' || !response.body) {
        this.emit({ type: 'body', url: info.url, text: await response.text() })
      } else {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          this.emit({ type: 'chunk', url: info.url, text: decoder.decode(value, { stream: true }) })
        }
      }
      this.emit({ type: 'end', url: info.url, ok: response.ok })
    } catch {
      this.emit({ type: 'end', url: info.url, ok: false })
    }
  }
}
