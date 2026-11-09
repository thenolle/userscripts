import { getPageWindow } from '@nolly/core'
import { storage } from '../../core/storage'
import { readCookieAccountId } from './account-cookie'
import { looksAuthenticated } from './plan'
import type { ApiDiagnostics, RateLimitResponse, SettingsResponse } from './types'

type AccountSource = ApiDiagnostics['account']

const RANK: Readonly<Record<AccountSource, number>> = { none: -1, stored: 0, session: 1, cookie: 2, captured: 3, manual: 4 }

const ACCOUNT_KEY = 'usage-status:account-id'
const ACCOUNT_HEADER = 'x-pplx-account'
const SESSION_PATH = '/api/auth/session?version=2.18&source=default'
const SESSION_RETRY = 60_000
const PROBE_INTERVAL = 10 * 60_000
const BASE_HEADERS = { 'x-app-apiclient': 'default', 'x-app-apiversion': '2.18' } as const

interface Profile {
  readonly name: string
  readonly rate: string
  readonly settings: string
  readonly headers: Record<string, string>
  readonly withAccount: boolean
}

type Fetcher = (url: string, init: RequestInit) => Promise<Response>

interface Transport {
  readonly name: string
  readonly fetch: Fetcher
}

interface Attempt {
  readonly id: string
  readonly profile: Profile
  readonly transport: Transport
}

interface CallResult<T> {
  data: T | null
  status: number | null
  error?: string
}

interface Outcome {
  rate: RateLimitResponse | null
  settings: SettingsResponse | null
}

export interface UsagePayload extends Outcome {
  diagnostics: ApiDiagnostics
}

const PROFILES: readonly Profile[] = [
  {
    name: 'versioned',
    rate: '/rest/rate-limit/all?version=2.18&source=default',
    settings: '/rest/user/settings?skip_connector_picker_credentials=true&version=2.18&source=default',
    headers: BASE_HEADERS,
    withAccount: true
  },
  { name: 'plain', rate: '/rest/rate-limit/all', settings: '/rest/user/settings', headers: {}, withAccount: false }
]

const createTransports = (): Transport[] => {
  const transports: Transport[] = [{ name: 'sandbox', fetch: (url, init) => fetch(url, init) }]
  const page = getPageWindow()
  if (page?.fetch) {
    transports.push({ name: 'page', fetch: (url, init) => page.fetch(url, typeof cloneInto === 'function' ? cloneInto(init, page) : init) })
  }
  return transports
}

export class UsageApi {
  private readonly attempts: readonly Attempt[] = createTransports().flatMap((transport) =>
    PROFILES.map((profile) => ({ id: `${profile.name}/${transport.name}`, profile, transport }))
  )
  private accountId: string | null = storage.get<string | null>(ACCOUNT_KEY, null)
  private accountSource: AccountSource = this.accountId ? 'stored' : 'none'
  private preferred: number | null = null
  private lastProbeAt = 0
  private lastSessionTryAt = 0

  get currentAccountId(): string | null {
    return this.accountId
  }

  setAccountId(id: string, source: Exclude<AccountSource, 'none' | 'stored'>): void {
    if (!id || RANK[source] < RANK[this.accountSource]) return
    if (id === this.accountId) {
      this.accountSource = source
      return
    }
    this.accountId = id
    this.accountSource = source
    this.preferred = null
    this.lastProbeAt = 0
    storage.set(ACCOUNT_KEY, id)
  }

  async fetchAll(): Promise<UsagePayload> {
    await this.resolveAccountId()
    const now = Date.now()
    const probing = this.preferred === null && now - this.lastProbeAt >= PROBE_INTERVAL
    const indices = probing ? this.attempts.map((_, index) => index) : [this.preferred ?? 0]
    if (probing) this.lastProbeAt = now
    const diagnostics: ApiDiagnostics = { chosen: null, account: this.accountSource, accountPreview: this.accountId?.slice(0, 8) ?? null, attempts: [] }
    let fallback: Outcome | null = null
    for (const index of indices) {
      const attempt = this.attempts[index]!
      const outcome = await this.run(attempt, diagnostics)
      if (!outcome) continue
      fallback ??= outcome
      if (looksAuthenticated(outcome.settings)) {
        this.preferred = index
        diagnostics.chosen = attempt.id
        return { ...outcome, diagnostics }
      }
      if (this.preferred === index) this.preferred = null
    }
    if (!fallback) throw new Error('Usage data unavailable.')
    diagnostics.chosen = this.attempts[indices[0]!]?.id ?? null
    return { ...fallback, diagnostics }
  }

  private async resolveAccountId(): Promise<void> {
    const cookieId = readCookieAccountId()
    if (cookieId) this.setAccountId(cookieId, 'cookie')
    if (this.accountId && this.accountSource !== 'stored') return
    if (Date.now() - this.lastSessionTryAt < SESSION_RETRY) return
    this.lastSessionTryAt = Date.now()
    try {
      const response = await this.attempts[0]!.transport.fetch(`${location.origin}${SESSION_PATH}`, { credentials: 'include', headers: BASE_HEADERS })
      const data = (await response.json()) as { user?: { id?: string } }
      if (data?.user?.id) this.setAccountId(data.user.id, 'session')
    } catch {
      return
    }
  }

  private async run(attempt: Attempt, diagnostics: ApiDiagnostics): Promise<Outcome | null> {
    const [rate, settings] = await Promise.all([
      this.call<RateLimitResponse>(attempt, attempt.profile.rate),
      this.call<SettingsResponse>(attempt, attempt.profile.settings)
    ])
    diagnostics.attempts.push({
      profile: attempt.profile.name,
      transport: attempt.transport.name,
      rate: rate.status,
      settings: settings.status,
      authenticated: looksAuthenticated(settings.data),
      ...(rate.error || settings.error ? { error: rate.error ?? settings.error } : {})
    })
    return rate.data || settings.data ? { rate: rate.data, settings: settings.data } : null
  }

  private async call<T>(attempt: Attempt, path: string): Promise<CallResult<T>> {
    const headers = { ...attempt.profile.headers, ...(attempt.profile.withAccount && this.accountId ? { [ACCOUNT_HEADER]: this.accountId } : {}) }
    try {
      const response = await attempt.transport.fetch(`${location.origin}${path}`, { credentials: 'include', headers })
      if (!response.ok) return { data: null, status: response.status }
      const data = JSON.parse(JSON.stringify(await response.json())) as T
      return { data, status: response.status }
    } catch (error) {
      return { data: null, status: null, error: error instanceof Error ? error.message : String(error) }
    }
  }
}