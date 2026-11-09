import { createElement } from '@nolly/core'
import { createButton, createDataRow, createSection } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import { createStatusBar, createTimerBlock } from './components'
import { LIMITS, LIMIT_KEYS, SETTINGS_FIELDS, SOURCE_LABELS, STATUS_LABELS } from './definitions'
import { getStatus } from './format'
import { updateLive } from './live'
import type { UsageService } from './service'
import { ensureUsageStyles } from './styles'
import type { ActiveUsage, SettingField } from './types'

const DIALOG_ID = 'better-perplexity-usage-dialog'

const formatSetting = (value: unknown, type: SettingField['type']): string => {
	if (value === null || value === undefined) return '—'
	if (type === 'bool') return value ? 'Yes' : 'No'
	return String(value)
}

export class UsageDialog {
	private readonly openSections = new Set<string>()

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
		const ui = createDialog({ id: DIALOG_ID, title: 'Usage & account', description: 'Live limits, estimated replenishment and account details.', width: 680 })
		ui.dialog.classList.add('bp-usage-dialog')
		const updated = createElement('span', 'bp-updated', 'Loading usage data…')
		updated.dataset['bpUpdated'] = ''
		const refresh = createButton('Refresh', { primary: true, onClick: () => void this.service.refresh() })
		refresh.dataset['bpRefresh'] = ''
		ui.footer.append(updated, createButton('Settings', { onClick: this.openSettings }), refresh)
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
		const body = dialog.querySelector<HTMLElement>('.bp-dialog-body')
		if (!body) return
		const scrollTop = body.scrollTop
		const nodes: HTMLElement[] = []
		if (this.service.lastError && !this.service.rate && !this.service.settings) nodes.push(createElement('div', 'bp-error', `Unable to retrieve usage data: ${this.service.lastError.message}`))
		const notice = this.service.getNotice()
		if (notice) nodes.push(createElement('div', 'bp-notice', notice))
		const current = createSection('Current mode')
		current.appendChild(this.renderHero(this.service.getActive()))
		const details = createSection('Details')
		details.append(this.renderMcp(), ...this.renderModelLimits(), this.renderSettings(), this.renderRaw())
		nodes.push(current, this.renderLimits(), details)
		body.replaceChildren(...nodes)
		body.scrollTop = scrollTop
		const refresh = dialog.querySelector<HTMLButtonElement>('[data-bp-refresh]')
		if (refresh) {
			refresh.disabled = this.service.fetching
			refresh.textContent = this.service.fetching ? 'Refreshing…' : 'Refresh'
		}
		updateLive(this.service)
	}

	private renderHero(active: ActiveUsage | null): HTMLElement {
		const hero = createElement('section', 'bp-hero')
		if (!active) {
			hero.appendChild(createElement('div', 'bp-empty', 'The selected mode could not be identified.'))
			return hero
		}
		const title = createElement('div', 'bp-hero-title')
		title.append(createElement('span', 'bp-hero-label', 'Selected mode'), createElement('span', 'bp-hero-mode', active.label))
		const top = createElement('div', 'bp-hero-top')
		top.append(title, createElement('span', `bp-badge ${active.status}`, active.freeFallback ? 'Free queries' : STATUS_LABELS[active.status]))
		const count = createElement('div', 'bp-hero-count', active.remaining === null ? '—' : String(active.remaining))
		const heroTotal = this.service.formatTotal(active.key)
		if (heroTotal) count.appendChild(createElement('span', 'bp-hero-total', ` / ${heroTotal}`))
		hero.append(top, count)
		if (active.total !== null && active.remaining !== null) hero.appendChild(createStatusBar(active.remaining, active.total, active.status))
		hero.appendChild(active.key ? createTimerBlock(this.service, active.key) : createElement('div', 'bp-timer-text', active.reset))
		const meta = createElement('div', 'bp-hero-meta')
		meta.append(createElement('span', undefined, `Plan: ${this.service.formatPlan()}`), createElement('span', undefined, `Free queries: ${this.service.formatFreeQueries()}`))
		hero.appendChild(meta)
		const pace = this.service.formatPace(active.key)
		if (pace) hero.appendChild(createElement('div', 'bp-timer-text', pace))
		return hero
	}

	private renderLimits(): HTMLElement {
		const section = createSection('All limits')
		const grid = createElement('div', 'bp-usage-grid')
		for (const key of LIMIT_KEYS) {
			const remaining = this.service.getRemaining(key)
			const total = this.service.resolveTotal(key)
			const status = getStatus(remaining, total)
			const card = createElement('article', 'bp-card')
			const top = createElement('div', 'bp-card-top')
			top.append(createElement('span', 'bp-card-name', LIMITS[key].label), createElement('span', `bp-dot ${status}`))
			const count = createElement('div', 'bp-card-count', remaining === null ? '—' : String(remaining))
			const cardTotal = this.service.formatTotal(key)
			if (cardTotal) count.appendChild(createElement('span', 'bp-card-total', ` / ${cardTotal}`))
			card.append(top, count, createElement('div', 'bp-card-period', LIMITS[key].period))
			if (total !== null && remaining !== null) card.appendChild(createStatusBar(remaining, total, status))
			card.appendChild(createTimerBlock(this.service, key))
			grid.appendChild(card)
		}
		section.appendChild(grid)
		return section
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
		const content = list.childElementCount ? list : createElement('div', 'bp-empty', 'No active MCP sources.')
		return this.createDetails('mcp', 'MCP sources', `${metered} metered`, content)
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
			const className = field.type === 'bool' ? (value ? 'positive' : 'negative') : ''
			list.appendChild(createDataRow(field.label, formatSetting(value, field.type), className))
		}
		const content = list.childElementCount ? list : createElement('div', 'bp-empty', 'No account settings were returned.')
		return this.createDetails('settings', 'Account settings', String(list.childElementCount), content)
	}

	private renderRaw(): HTMLElement {
		const payload = { diagnostics: this.service.diagnostics, rateLimits: this.service.rate, settings: this.service.settings }
		return this.createDetails('raw', 'Raw API data', 'debug', createElement('pre', 'bp-raw', JSON.stringify(payload, null, 2)))
	}
}
