import { Tooltip, createButton, createDataRow, createDialog, createSection, ensureUiStyles, markUi, showToast, uiConfig } from '@nolly/ai'
import { Feature, createElement, injectStyle } from '@nolly/core'
import type { MenuEntry, ScriptContext } from '@nolly/core'
import { placeTool } from '../header-tools'
import { session } from '../runtime'
import { storage } from '../storage'
import { PILL_BUTTON_CLASS } from '../header-style'

const PRIMARY_KEY = 'usage-status:primary'
const LAST_KEY = 'usage-status:last'
const LOW = 2

const LABELS: Readonly<Record<string, string>> = {
	reason: 'Reasoning',
	file_upload: 'File uploads',
	paste_text_to_file: 'Pasted text as file',
	image_gen: 'Image generation',
	deep_research: 'Deep research'
}

const CSS = `
.bp-usage-pill[data-level='low'] { color: var(--bp-yellow); }
.bp-usage-pill[data-level='empty'] { color: var(--bp-red); }
`

const labelOf = (feature: string): string => LABELS[feature] ?? feature.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase())

const formatReset = (iso: string | null): string => {
	const ms = iso ? Date.parse(iso) - Date.now() : Number.NaN
	if (!Number.isFinite(ms)) return 'no reset time'
	if (ms <= 0) return 'resetting now'
	const minutes = Math.round(ms / 60_000)
	if (minutes < 60) return `resets in ${minutes}m`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `resets in ${hours}h ${minutes % 60}m`
	return `resets ${new Date(iso as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

const level = (remaining: number): 'ok' | 'low' | 'empty' => (remaining === 0 ? 'empty' : remaining <= LOW ? 'low' : 'ok')

const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)

export class UsageFeature extends Feature {
	readonly id = 'usage-status'
	readonly name = 'Usage Status'
	readonly description = 'Shows your remaining limits (reasoning, uploads, images, research) and your plan.'

	private readonly pill = markUi(createElement('button', `${PILL_BUTTON_CLASS} bp-usage-pill bp-themed`))
	private readonly label = createElement('span')
	private readonly tooltip: Tooltip

	constructor(context: ScriptContext) {
		super(context)
		ensureUiStyles()
		injectStyle(`${uiConfig().id}-usage-styles`, CSS)
		this.pill.type = 'button'
		this.pill.setAttribute('aria-label', 'Usage status')
		this.pill.appendChild(this.label)
		this.pill.addEventListener('click', () => this.open())
		this.tooltip = new Tooltip(this.pill, (container) => container.append(this.rows()), { align: 'end' })
	}

	private get primary(): string {
		return storage.get(PRIMARY_KEY, 'reason')
	}

	override onEnable(): void {
		this.scope.add(
			session.subscribe((event) => {
				if (event !== 'limits' && event !== 'usage' && event !== 'plan') return
				if (event === 'limits') this.checkAlerts()
				this.update()
				this.context.refreshMenu()
			})
		)
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
			{ id: 'metric', label: `Badge Shows: ${labelOf(this.primary)} (click to change)`, action: () => this.cycle() }
		]
	}

	private update(): void {
		const entry = session.limit(this.primary)
		this.label.textContent = entry ? `${labelOf(entry.feature)} ${entry.remaining}` : session.plan ? `${titleCase(session.plan)} plan` : 'Usage'
		this.pill.dataset['level'] = entry ? level(entry.remaining) : 'ok'
		this.tooltip.refresh()
	}

	private cycle(): void {
		const features = session.limits.map((limit) => limit.feature)
		if (!features.length) return
		storage.set(PRIMARY_KEY, features[(features.indexOf(this.primary) + 1) % features.length] ?? 'reason')
		this.context.refreshMenu()
		this.update()
	}

	private rows(): HTMLElement {
		const list = createElement('div', 'bp-data-list')
		const limits = session.limits
		if (!limits.length) {
			list.appendChild(createElement('div', 'bp-empty', 'No limit data yet. Send a message or reload the page.'))
			return list
		}
		for (const limit of limits) list.appendChild(createDataRow(labelOf(limit.feature), `${limit.remaining} left · ${formatReset(limit.resetAfter)}`, limit.remaining === 0 ? 'negative' : ''))
		return list
	}

	private open(): void {
		const dialogId = `${uiConfig().id}-usage-dialog`
		const existing = document.getElementById(dialogId)
		if (existing instanceof HTMLDialogElement) {
			existing.close()
			return
		}
		const ui = createDialog({ id: dialogId, title: 'Usage', description: session.plan ? `${titleCase(session.plan)} plan` : 'Plan not detected yet', width: 480 })
		const limits = createSection('Limits')
		limits.appendChild(this.rows())
		const body = [limits]
		const { usage } = session
		if (usage?.usedPercent !== null && usage?.usedPercent !== undefined) {
			const window = createSection('Rolling window')
			const bar = createElement('div', 'bp-progress')
			const fill = createElement('div', `bp-progress-fill ${usage.limitReached ? 'empty' : ''}`.trim())
			fill.style.width = `${Math.min(100, usage.usedPercent)}%`
			bar.appendChild(fill)
			const reset = usage.resetAt ? new Date(usage.resetAt * 1000).toLocaleString() : 'unknown'
			window.append(bar, createDataRow('Used', `${usage.usedPercent}%`), createDataRow('Resets', reset))
			body.push(window)
		}
		if (session.maxFileMb !== null) {
			const files = createSection('Files')
			files.appendChild(createDataRow('Largest file', `${session.maxFileMb} MB`))
			body.push(files)
		}
		ui.body.replaceChildren(...body)
		ui.footer.append(createButton('Close', { primary: true, onClick: ui.close }))
		ui.show()
	}

	private checkAlerts(): void {
		const last = storage.get<Record<string, number>>(LAST_KEY, {})
		const next = { ...last }
		for (const { feature, remaining, resetAfter } of session.limits) {
			const before = last[feature]
			next[feature] = remaining
			if (before === undefined) continue
			const name = labelOf(feature)
			if (before > 0 && remaining === 0) showToast(`${name}: none left, ${formatReset(resetAfter)}.`, [], 10_000)
			else if (before === 0 && remaining > 0) showToast(`${name} is available again (${remaining} left).`, [], 8_000)
			else if (before > LOW && remaining > 0 && remaining <= LOW) showToast(`${name}: only ${remaining} left, ${formatReset(resetAfter)}.`, [], 8_000)
		}
		storage.set(LAST_KEY, next)
	}
}
