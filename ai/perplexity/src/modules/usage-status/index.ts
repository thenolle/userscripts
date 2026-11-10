import { Feature, notifyPermission, requestNotifyPermission, type MenuEntry, type ScriptContext } from '@nolly/core'
import { CONFIG } from '../../config'
import { fetchSpy } from '../../core/fetch-spy'
import { logger } from '../../core/logger'
import { isAskRequest } from '../../core/requests'
import { describePage } from '../../locate'
import { showToast } from '@nolly/ai'
import { UsageAlerts } from './alerts'
import { UsageDialog } from './dialog'
import { UsageIndicator } from './indicator'
import { updateLive } from './live'
import { resolvePlacement } from './placement'
import { SendDetector } from './send-detector'
import { UsageService } from './service'

export class UsageStatusModule extends Feature {
	readonly id = 'usage-status'
	readonly name = 'Usage Quota V2'
	readonly description = 'Reported allowances and observation-based recovery estimates in one usage feature.'

	private readonly service = new UsageService()
	private readonly dialog = new UsageDialog(this.service, () => this.context.openSettings())
	private readonly alerts = new UsageAlerts(this.service, () => this.dialog.open())
	private readonly sendDetector = new SendDetector(() => this.handleSend(false))
	private indicator: UsageIndicator | null = null
	private sendTimers: number[] = []

	constructor(context: ScriptContext) {
		super(context)
		this.service.subscribe(() => {
			this.indicator?.render()
			this.dialog.render()
			if (this.enabled) this.alerts.check()
		})
		fetchSpy.subscribe(({ accountId, method, url }) => {
			if (accountId) this.service.setAccountId(accountId, 'captured')
			if (this.enabled && isAskRequest(method, url)) this.handleSend(true)
		})
	}

	override onEnable(): void {
		this.sendDetector.attach()
		this.scope.add(() => this.sendDetector.detach())
		this.scope.add(() => this.clearSendTimers())
		this.scope.add(() => this.removeUi())
		this.scope.interval(() => this.service.pollIfDue(this.alerts.wantsBackground()), CONFIG.usage.pollTick)
		this.scope.interval(() => updateLive(this.service), CONFIG.usage.tickInterval)
		this.scope.listen(document, 'visibilitychange', () => {
			if (document.visibilityState === 'visible') this.service.refreshIfStale(CONFIG.usage.visibleStaleAfter)
		})
	}

	run(): void {
		if (!this.enabled) return
		this.ensureIndicator()
		if (this.service.shouldAutoFetch()) void this.service.refresh()
		this.indicator?.render()
	}

	override menuEntries(): MenuEntry[] {
		const entries: MenuEntry[] = [
			{ label: 'Open Usage Dialog', action: () => this.dialog.open() },
			{ id: 'alerts', label: `Turn Refill Alerts ${this.alerts.enabled ? 'Off' : 'On'}`, action: () => this.toggleAlerts() }
		]
		if (notifyPermission() === 'default') entries.push({ id: 'notifications', label: 'Allow Desktop Notifications', action: () => void this.askPermission() })
		entries.push(
			{ label: 'Set Perplexity Account ID', action: () => this.promptAccountId() },
			{ label: 'Reset Learned Usage Data', action: () => this.service.resetLearning() },
			{ label: 'Copy Page Diagnostics', action: () => void this.copyDiagnostics() }
		)
		return entries
	}

	private toggleAlerts(): void {
		this.alerts.enabled = !this.alerts.enabled
		showToast(`Refill alerts are ${this.alerts.enabled ? 'on' : 'off'}.`)
		this.context.refreshMenu()
	}

	private async askPermission(): Promise<void> {
		const permission = await requestNotifyPermission()
		showToast(permission === 'granted' ? 'Desktop notifications are on. Alerts also arrive when this tab is in the background.' : 'Desktop notifications are not allowed. Alerts will show inside Perplexity instead.')
		this.context.refreshMenu()
	}

	private promptAccountId(): void {
		const value = window.prompt('Paste the x-pplx-account request header value (DevTools > Network > any perplexity.ai/rest request):', '')?.trim()
		if (!value) return
		this.service.setAccountId(value, 'manual')
		void this.service.refresh()
	}

	private async copyDiagnostics(): Promise<void> {
		const report = JSON.stringify({ version: __VERSION__, page: describePage(), mode: this.service.getActive(), counters: this.service.rate, api: this.service.diagnostics }, null, 2)
		try {
			await navigator.clipboard.writeText(report)
			showToast('Diagnostics copied to the clipboard.')
		} catch {
			logger.info('Page diagnostics', report)
			showToast('Could not copy; the diagnostics are in the console.')
		}
	}

	private ensureIndicator(): void {
		const placement = resolvePlacement()
		this.indicator ??= new UsageIndicator(this.service, () => this.dialog.open())
		this.indicator.mount(placement)
	}

	private handleSend(confirmed: boolean): void {
		this.service.noteSend(Date.now(), confirmed)
		this.clearSendTimers()
		const refreshes = CONFIG.usage.refreshDelays.map((delay) =>
			window.setTimeout(() => {
				void this.service.refresh()
				this.context.requestUpdate()
			}, delay)
		)
		const updates = CONFIG.usage.sendUpdateDelays.map((delay) => window.setTimeout(this.context.requestUpdate, delay))
		this.sendTimers = [...refreshes, ...updates]
	}

	private clearSendTimers(): void {
		for (const timer of this.sendTimers) window.clearTimeout(timer)
		this.sendTimers = []
	}

	private removeUi(): void {
		this.indicator?.destroy()
		this.indicator = null
		this.dialog.close()
	}
}
