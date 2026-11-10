const ACCOUNT_HEADER = 'x-pplx-account'
const IGNORED_PATHS = ['/rest/rate-limit', '/rest/user/settings']

export class FetchWatcher {
  accountId: string | null = null
  private installed = false

  constructor(private readonly onSend: () => void) {}

  install(): void {
    if (this.installed) return
    this.installed = true
    const original = window.fetch.bind(window)
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      this.inspect(input, init)
      return original(input, init)
    }) as typeof fetch
  }

  private inspect(input: RequestInfo | URL, init?: RequestInit): void {
    try {
      const request = input instanceof Request ? input : null
      const id = new Headers(init?.headers ?? request?.headers).get(ACCOUNT_HEADER)
      if (id) this.accountId = id
      const url = request?.url ?? String(input)
      const method = (init?.method ?? request?.method ?? 'GET').toUpperCase()
      if (method === 'POST' && url.includes('/rest/') && !IGNORED_PATHS.some((path) => url.includes(path))) this.onSend()
    } catch {
      return
    }
  }
}