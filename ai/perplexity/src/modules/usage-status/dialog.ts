import { createElement } from '@nolly/core'
import { LEVEL_GLYPH, LEVEL_LABEL, createButton, createDataRow, createDialog, createQuotaPanel, createSection, worstLevel } from '@nolly/ai'
import type { QuotaPanel } from '@nolly/ai'
import { SETTINGS_FIELDS, SOURCE_LABELS } from './definitions'
import type { UsageService } from './service'
import { ensureUsageStyles } from './styles'
import type { SettingField } from './types'

const DIALOG_ID = 'better-perplexity-usage-dialog'

const formatSetting = (value: unknown, type: SettingField['type']): string => {
	if (value === null || value === undefined) return '—'
	if (type === 'bool') return value ? 'Yes' : 'No'
	return String(value)
}

export class UsageDialog {
	private readonly openSections = new Set<string>()
	private panel: QuotaPanel | null = null
	private summary: HTMLElement | null = null
	private details: HTMLElement | null = null

	constructor(
		private readonly service: UsageService,
		private readonly openSettings: () => void
	) { }

	private get element(): HTMLDialogElement | null {
		const element = document.getElementById(DIALOG_ID)
		return element instanceof HTMLDialogElement ? element : null
	}

	open(): void {
		const existing = this.element
		if (existing) {
			if (!existing.open) existing.showModal()
			this.render()
			return
		}
		ensureUsageStyles()
		const ui = createDialog({ id: DIALOG_ID, title: 'Usage & account', description: 'Live limits with estimated refill and full-recovery times.', width: 820 })
		ui.dialog.classList.add('bp-usage-dialog')
		this.summary = createElement('div', 'bp-qc-summary')
		this.summary.setAttribute('role', 'status')
		this.details = createElement('div')
		const panel = createQuotaPanel(() => this.service.getQuotaReports(), { activeKey: () => this.service.getActive().key })
		this.panel = panel
		const body = createElement('div', 'bp-stack')
		body.append(this.summary, panel.element, this.details)
		ui.body.appendChild(body)
		const updated = createElement('span', 'bp-updated', 'Loading usage data…')
		updated.dataset['bpUpdated'] = ''
		const refresh = createButton('Refresh', { primary: true, onClick: () => void this.service.refresh() })
		refresh.dataset['bpRefresh'] = ''
		ui.footer.append(updated, createButton('Settings', { onClick: this.openSettings }), refresh)
		ui.dialog.addEventListener('close', () => {
			panel.destroy()
			if (this.panel === panel) {
				this.panel = null
				this.summary = null
				this.details = null
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
		if (!dialog?.open || !this.summary || !this.details) return
		const reports = this.service.getQuotaReports()
		const level = worstLevel(reports.map((report) => report.level))
		const worst = createElement('span', 'bp-qc')
		worst.dataset['level'] = level
		const pill = createElement('span', 'bp-qc-pill')
		pill.append(createElement('span', 'bp-qc-glyph', LEVEL_GLYPH[level]), document.createTextNode(reports.length ? `Overall: ${LEVEL_LABEL[level]}` : 'Waiting for data'))
		worst.appendChild(pill)
		const notice = this.service.getNotice()
		this.summary.replaceChildren(
			worst,
			createElement('span', undefined, `Plan: ${this.service.formatPlan()}`),
			createElement('span', undefined, `Free queries: ${this.service.formatFreeQueries()}`),
			...(notice ? [createElement('span', 'bp-hint', notice)] : [])
		)
		const error = this.service.lastError && !this.service.rate && !this.service.settings ? [createElement('div', 'bp-error', `Unable to retrieve usage data: ${this.service.lastError.message}`)] : []
		const section = createSection('Details')
		section.append(this.renderMcp(), ...this.renderModelLimits(), this.renderSettings(), this.renderRaw())
		this.details.replaceChildren(...error, section)
		const refresh = dialog.querySelector<HTMLButtonElement>('[data-bp-refresh]')
		if (refresh) {
			refresh.disabled = this.service.fetching
			refresh.textContent = this.service.fetching ? 'Refreshing…' : 'Refresh'
		}
		const updated = dialog.querySelector<HTMLElement>('[data-bp-updated]')
		if (updated) updated.textContent = this.service.lastFetchedAt ? `Updated ${new Date(this.service.lastFetchedAt).toLocaleTimeString()}` : 'Waiting for usage data'
		this.panel?.refresh()
	}

	private createDetails(id: string, title: string, count: string, content: HTMLElement): HTMLElement {
		const details = createElement('details', 'bp-details')
		details.open = this.openSections.has(id)
		const summary = createElement('summary', 'bp-details-summary')
		summary.append(createElement('span', 'bp-details-title', title), createElement('span', 'bp-details-count', count))
		details.append(summary, content)
		details.addEventListener('toggle', () => {
			if (details.open) this.openSections.add(id)
			else this.openSections.delete(id)
		})
		return details
	}

	private renderMcp(): HTMLElement {
		const sources = this.service.rate?.sources?.source_to_limit
		if (!sources) return this.createDetails('mcp', 'MCP sources', 'unavailable', createElement('div', 'bp-empty', 'No MCP usage data available.'))
		const list = createElement('div', 'bp-data-list')
		let metered = 0
		for (const [key, value] of Object.entries(sources)) {
			if (!value) continue
			const label = SOURCE_LABELS[key] ?? key
			if (value.monthly_limit === null || value.monthly_limit === undefined) {
				list.appendChild(createDataRow(label, 'Unmetered'))
				continue
			}
			if (value.monthly_limit === 0) continue
			metered++
			list.appendChild(createDataRow(label, `${value.remaining ?? '—'} / ${value.monthly_limit}`))
		}
		return this.createDetails('mcp', 'MCP sources', `${metered} metered`, list.childElementCount ? list : createElement('div', 'bp-empty', 'No active MCP sources.'))
	}

	private renderModelLimits(): HTMLElement[] {
		const limits = this.service.rate?.model_specific_limits
		if (!limits || !Object.keys(limits).length) return []
		const list = createElement('div', 'bp-data-list')
		for (const [key, value] of Object.entries(limits)) list.appendChild(createDataRow(key, typeof value === 'object' ? JSON.stringify(value) : String(value)))
		return [this.createDetails('models', 'Model limits', String(Object.keys(limits).length), list)]
	}

	private renderSettings(): HTMLElement {
		const settings = this.service.settings
		if (!settings) return this.createDetails('settings', 'Account settings', 'unavailable', createElement('div', 'bp-empty', 'Settings data unavailable.'))
		const list = createElement('div', 'bp-data-list')
		for (const field of SETTINGS_FIELDS) {
			const value = settings[field.key]
			if (value === undefined) continue
			list.appendChild(createDataRow(field.label, formatSetting(value, field.type), field.type === 'bool' ? (value ? 'positive' : 'negative') : ''))
		}
		return this.createDetails('settings', 'Account settings', String(list.childElementCount), list.childElementCount ? list : createElement('div', 'bp-empty', 'No account settings were returned.'))
	}

	private renderRaw(): HTMLElement {
		const payload = { diagnostics: this.service.diagnostics, rateLimits: this.service.rate, settings: this.service.settings }
		return this.createDetails('raw', 'Raw API data', 'private · debug', createElement('pre', 'bp-raw', JSON.stringify(payload, null, 2)))
	}
}
