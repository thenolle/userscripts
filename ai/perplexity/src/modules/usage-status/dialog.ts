import { createElement } from '@nolly/core'
import { createButton, createDataRow, createDialog, createQuotaPanel, createSection } from '@nolly/ai'
import type { QuotaPanel } from '@nolly/ai'
import { LIMITS } from './definitions'
import type { UsageService } from './service'
import { ensureUsageStyles } from './styles'

const DIALOG_ID = 'better-perplexity-usage-dialog'

export class UsageDialog {
	private panel: QuotaPanel | null = null
	private heading: HTMLElement | null = null

	constructor(
		private readonly service: UsageService,
		private readonly openSettings: () => void
	) { }

	private get element(): HTMLDialogElement | null {
		const element = document.getElementById(DIALOG_ID)
		return element instanceof HTMLDialogElement ? element : null
	}

	open(): void {
		if (this.element?.open) {
			this.render()
			return
		}
		ensureUsageStyles()
		const ui = createDialog({ id: DIALOG_ID, title: 'Usage Quota V2', description: 'Reported allowances, recovery observations and conditional forecasts.', width: 760 })
		this.heading = createElement('div', 'bp-data-list')
		this.panel = createQuotaPanel(() => this.service.getQuotaReports())
		const account = createSection('Account and diagnostics')
		const details = createElement('details', 'bp-details')
		details.dataset['quotaDiagnostics'] = ''
		details.appendChild(createElement('summary', 'bp-details-summary', 'Raw API data · may contain private account information'))
		details.appendChild(createElement('pre', 'bp-raw'))
		account.appendChild(details)
		ui.body.append(this.heading, this.panel.element, account)
		const refresh = createButton('Refresh usage', { primary: true, onClick: () => void this.service.refresh() })
		refresh.dataset['quotaRefresh'] = ''
		ui.footer.append(createButton('Settings', {
			onClick: () => {
				ui.close()
				window.setTimeout(this.openSettings, 0)
			}
		}), refresh, createButton('Close', { onClick: ui.close }))
		const panel = this.panel
		ui.dialog.addEventListener('close', () => {
			panel.destroy()
			if (this.panel === panel) {
				this.panel = null
				this.heading = null
			}
		}, { once: true })
		ui.show()
		this.render()
		if (!this.service.initialized && !this.service.fetching) void this.service.refresh()
	}

	close(): void {
		this.element?.close()
	}

	render(): void {
		const dialog = this.element
		if (!dialog?.open) return
		const active = this.service.getActive()
		this.heading?.replaceChildren(
			createDataRow('Selected counter', active.key ? LIMITS[active.key].label : active.label),
			createDataRow('Plan · reported', this.service.formatPlan()),
			createDataRow('Free queries · reported', this.service.formatFreeQueries()),
			createDataRow('Updated', this.service.lastFetchedAt ? new Date(this.service.lastFetchedAt).toLocaleString() : 'Waiting for a response')
		)
		const refresh = dialog.querySelector<HTMLButtonElement>('[data-quota-refresh]')
		if (refresh) {
			refresh.disabled = this.service.fetching
			refresh.textContent = this.service.fetching ? 'Refreshing…' : 'Refresh usage'
		}
		const pre = dialog.querySelector<HTMLElement>('[data-quota-diagnostics] pre')
		if (pre) {
			pre.textContent = JSON.stringify({
				diagnostics: this.service.diagnostics,
				rateLimits: this.service.rate,
				settings: this.service.settings,
				error: this.service.lastError?.message ?? null
			}, null, 2)
		}
		this.panel?.refresh()
	}
}
