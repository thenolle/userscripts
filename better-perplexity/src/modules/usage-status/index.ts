import { CONFIG } from '../../config'
import { fetchSpy } from '../../core/fetch-spy'
import { Feature, type MenuEntry, type ScriptContext } from '@nolly/core'
import { UsageDialog } from './dialog'
import { UsageIndicator } from './indicator'
import { updateLive } from './live'
import { resolvePlacement } from './placement'
import { SendDetector } from './send-detector'
import { UsageService } from './service'

const isMessageRequest = (method: string, url: string): boolean => {
  return method === 'POST' && url.includes('/rest/') && !url.includes('/rest/rate-limit') && !url.includes('/rest/user/settings')
}

export class UsageStatusModule extends Feature {
  readonly id = 'usage-status'
  readonly name = 'Usage Status'
  readonly description = 'Display account usage and limits directly in the Perplexity header.'

  private readonly service = new UsageService()
  private readonly dialog = new UsageDialog(this.service, () => this.context.openSettings())
  private readonly sendDetector = new SendDetector(() => this.handleSend())
  private indicator: UsageIndicator | null = null
  private pollTimer = 0
  private tickTimer = 0
  private sendTimers: number[] = []

  constructor(context: ScriptContext) {
    super(context)
    this.service.subscribe(() => {
      this.indicator?.render()
      this.dialog.render()
    })
    fetchSpy.subscribe(({ accountId, method, url }) => {
      if (accountId) this.service.setAccountId(accountId, 'captured')
      if (this.enabled && isMessageRequest(method, url)) this.handleSend()
    })
  }

  run(): void {
    if (!this.enabled) {
      this.teardown()
      return
    }
    this.ensureIndicator()
    this.sendDetector.attach()
    if (this.service.shouldAutoFetch()) void this.service.refresh()
    this.pollTimer ||= window.setInterval(() => void this.service.refresh(), CONFIG.usage.refreshInterval)
    this.tickTimer ||= window.setInterval(() => updateLive(this.service), CONFIG.usage.tickInterval)
    this.indicator?.render()
  }

  override menuEntries(): MenuEntry[] {
    return [
      { label: 'Open Usage Dialog', action: () => this.dialog.open() },
      { label: 'Set Perplexity Account ID', action: () => this.promptAccountId() },
      { label: 'Reset Learned Usage Data', action: () => this.service.resetLearning() }
    ]
  }

  private promptAccountId(): void {
    const value = window.prompt('Paste the x-pplx-account request header value (DevTools > Network > any perplexity.ai/rest request):', '')?.trim()
    if (!value) return
    this.service.setAccountId(value, 'manual')
    void this.service.refresh()
  }

  private ensureIndicator(): void {
    const placement = resolvePlacement()
    if (!placement) {
      this.indicator?.destroy()
      this.indicator = null
      return
    }
    this.indicator ??= new UsageIndicator(this.service, () => this.dialog.open())
    this.indicator.mount(placement)
  }

  private handleSend(): void {
    this.service.markSent()
    for (const timer of this.sendTimers) window.clearTimeout(timer)
    const refreshes = CONFIG.usage.refreshDelays.map((delay) =>
      window.setTimeout(() => {
        void this.service.refresh()
        this.context.requestUpdate()
      }, delay)
    )
    const updates = CONFIG.usage.sendUpdateDelays.map((delay) => window.setTimeout(this.context.requestUpdate, delay))
    this.sendTimers = [...refreshes, ...updates]
  }

  private teardown(): void {
    this.indicator?.destroy()
    this.indicator = null
    this.dialog.close()
    this.sendDetector.detach()
    window.clearInterval(this.pollTimer)
    window.clearInterval(this.tickTimer)
    this.pollTimer = 0
    this.tickTimer = 0
  }
}