import { Tooltip, createButton, createDataRow, createDialog, createQuotaPanel, ensureUiStyles, LEVEL_GLYPH, LEVEL_LABEL, markUi, quotaLevel, quotaSummary, showToast, uiConfig } from '@nolly/ai'
import type { QuotaPanel } from '@nolly/ai'
import { Feature, createElement, injectStyle } from '@nolly/core'
import type { MenuEntry, ScriptContext } from '@nolly/core'
import { placeTool } from '../header-tools'
import { PILL_BUTTON_CLASS } from '../header-style'
import { session } from '../runtime'
import { storage } from '../storage'

const PRIMARY_KEY = 'usage-status:primary'
const LAST_KEY = 'usage-status:last'

const LABELS: Readonly<Record<string, string>> = {
	reason: 'Reasoning tool',
	file_upload: 'File uploads',
	paste_text_to_file: 'Paste-to-file',
	image_gen: 'Image generation',
	deep_research: 'Deep research'
}

const labelOf = (feature: string): string => LABELS[feature] ?? feature.replace(/_/g, ' ')

const resetText = (iso: string | null): string => {
	const timestamp = iso ? Date.parse(iso) : Number.NaN
	if (!Number.isFinite(timestamp)) return 'reset not reported'
	if (timestamp <= Date.now()) return 'reported reset passed · awaiting updated count'
	return `reset ${new Date(timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
}

const expired = (iso: string | null): boolean => {
	const timestamp = iso ? Date.parse(iso) : Number.NaN
	return Number.isFinite(timestamp) && timestamp <= Date.now()
}

export class UsageFeature extends Feature {
	readonly id = 'usage-status'
	readonly name = 'Usage Quota V2'
	readonly description = 'Shows reported tool allowances without inventing a chat-message quota.'

	private readonly pill = markUi(createElement('button', `${PILL_BUTTON_CLASS} bp-usage-pill bp-themed`))
	private readonly label = createElement('span')
	private readonly tooltip: Tooltip
	private panel: QuotaPanel | null = null

	constructor(context: ScriptContext) {
		super(context)
		ensureUiStyles()
		injectStyle(`${uiConfig().id}-usage-styles`, `.bp-usage-pill[data-level='ok'] { color: var(--bp-green); }.bp-usage-pill[data-level='warning'] { color: var(--bp-yellow); }.bp-usage-pill[data-level='critical'], .bp-usage-pill[data-level='empty'] { color: var(--bp-red); }`)
		this.pill.type = 'button'
		this.pill.setAttribute('aria-label', 'Usage status')
		this.pill.appendChild(this.label)
		this.pill.addEventListener('click', () => this.open())
		this.tooltip = new Tooltip(this.pill, (container) => container.appendChild(this.rows()), { align: 'end' })
	}

	private get primary(): string {
		return storage.get(PRIMARY_KEY, 'reason')
	}

	override onEnable(): void {
		this.scope.add(session.subscribe((event) => {
			if (!['limits', 'usage', 'plan'].includes(event)) return
			if (event === 'limits') this.checkAlerts()
			this.update()
			this.renderOpenDialog()
			this.context.refreshMenu()
		}))
		this.scope.interval(() => {
			this.update()
			this.renderOpenDialog()
		}, 30_000)
	}

	override onDisable(): void {
		this.tooltip.hide()
		this.pill.remove()
		const dialog = document.getElementById(this.dialogId)
		if (dialog instanceof HTMLDialogElement) dialog.close()
	}

	run(): void {
		if (!this.enabled || !placeTool(this.pill, 'usage')) {
			this.tooltip.hide()
			this.pill.remove()
			return
		}
		this.update()
	}

	override menuEntries(): MenuEntry[] {
		return [
			{ id: 'details', label: 'Show Usage Details', action: () => this.open() },
			{ id: 'metric', label: `Badge: ${labelOf(this.primary)} · change`, action: () => this.cycle() }
		]
	}

	private get dialogId(): string {
		return `${uiConfig().id}-usage-dialog`
	}

	private update(): void {
		const entry = session.limit(this.primary)
		const stale = entry ? expired(entry.resetAfter) : false
		const level = entry && !stale ? quotaLevel(entry.remaining, session.capacity(entry.feature).total) : 'unknown'
		const text = entry ? `${labelOf(entry.feature)} ${stale ? '—' : entry.remaining}` : 'Tool usage'
		this.label.textContent = level === 'unknown' ? text : `${LEVEL_GLYPH[level]} ${text}`
		this.pill.dataset['level'] = level
		this.pill.setAttribute('aria-label', `Usage status: ${text}, ${LEVEL_LABEL[level]}`)
		this.tooltip.refresh()
	}

	private cycle(): void {
		const features = session.limits.map((limit) => limit.feature)
		if (!features.length) return
		const next = features[(features.indexOf(this.primary) + 1) % features.length]!
		storage.set(PRIMARY_KEY, next)
		this.update()
		this.context.refreshMenu()
	}

	private rows(): HTMLElement {
		const list = createElement('div', 'bp-data-list')
		if (!session.limits.length) {
			list.appendChild(createElement('div', 'bp-empty', 'No tool allowances reported yet.'))
			return list
		}
		for (const limit of session.limits) {
			const total = session.capacity(limit.feature).total
			const count = total === null ? `${limit.remaining}` : `${limit.remaining} of ${total}`
			const value = expired(limit.resetAfter) ? `Last reported: ${limit.remaining} · ${resetText(limit.resetAfter)}` : `${count} remaining · ${resetText(limit.resetAfter)}`
			const report = session.getQuotaReports().find((item) => item.key === limit.feature) ?? null
			list.appendChild(createDataRow(labelOf(limit.feature), `${value} · ${quotaSummary(report)}`))
		}
		return list
	}

	private renderOpenDialog(): void {
		this.panel?.refresh()
	}

	private open(): void {
		const existing = document.getElementById(this.dialogId)
		if (existing instanceof HTMLDialogElement) {
			existing.close()
			return
		}
		const ui = createDialog({ id: this.dialogId, title: this.name, description: session.plan ? `Reported plan: ${session.plan}` : 'Plan not reported', width: 760 })
		this.panel = createQuotaPanel(() => session.getQuotaReports(), { activeKey: () => this.primary })
		const panel = this.panel
		ui.body.appendChild(panel.element)
		if (session.maxFileMb !== null) ui.body.appendChild(createDataRow('API-reported general attachment ceiling', `${session.maxFileMb} MB · type-specific restrictions may be lower`))
		ui.body.appendChild(createElement('p', 'bp-hint', 'ChatGPT history is currently separated by reported plan, not a verified account id. Do not mix accounts in the same userscript storage. The unrelated /wham usage window is not treated as this chat’s quota.'))
		ui.dialog.addEventListener('close', () => {
			panel.destroy()
			if (this.panel === panel) this.panel = null
		}, { once: true })
		ui.footer.append(createButton('Close', { primary: true, onClick: ui.close }))
		ui.show()
	}

	private checkAlerts(): void {
		const last = storage.get<Record<string, number>>(LAST_KEY, {})
		const next = { ...last }
		for (const entry of session.limits) {
			if (expired(entry.resetAfter)) continue
			const before = last[entry.feature]
			next[entry.feature] = entry.remaining
			if (before === undefined) continue
			if (before > 0 && entry.remaining === 0) showToast(`${labelOf(entry.feature)}: none remaining · ${resetText(entry.resetAfter)}`)
			else if (before === 0 && entry.remaining > 0) showToast(`${labelOf(entry.feature)}: ${entry.remaining} now reported available.`)
		}
		storage.set(LAST_KEY, next)
	}
}
