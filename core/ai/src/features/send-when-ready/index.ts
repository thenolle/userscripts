import { Feature, createElement, injectStyle } from '@nolly/core'
import type { MenuEntry } from '@nolly/core'
import { readComposer } from '../../composer'
import { findComposer, isGenerating, sendPrompt, storage, writeComposer } from '../../platform'
import { QUOTA_STALE_MS, QuotaLedger } from '../../quota'
import type { QuotaReport } from '../../quota'
import { ComposerButton } from '../../ui/composer-button'
import { uiConfig } from '../../ui/config'
import { createButton, createTextArea } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import { showToast } from '../../ui/toast'

type Trigger =
	| { readonly kind: 'time'; readonly at: number }
	| { readonly kind: 'counter'; readonly key: string; readonly label: string }

interface Pending {
	readonly id: string
	readonly text: string
	readonly path: string
	readonly createdAt: number
	readonly trigger: Trigger
}

const KEY = 'send-when-ready:pending'
const MAX_PENDING = 5
const MAX_TEXT = 20_000
const COUNTDOWN = 10_000
const OVERDUE = 30 * 60_000
const TICK = 10_000

const CSS = `
.bp-srd { display: grid; gap: 12px; }
.bp-srd-row { display: grid; gap: 6px; font-size: 12px; font-weight: 600; }
.bp-srd-row select, .bp-srd-row input { font-weight: 400; }
.bp-srd-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; border: 1px solid var(--bp-border); border-radius: 10px; background: var(--bp-accent); font-size: 12px; }
.bp-srd-item-text { min-width: 0; }
.bp-srd-item-text strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bp-srd-item-actions { display: flex; flex-shrink: 0; gap: 6px; }
`

const valid = (value: unknown): value is Pending => {
	const item = value as Partial<Pending> | null
	if (!item || typeof item.id !== 'string' || typeof item.text !== 'string' || typeof item.path !== 'string' || typeof item.createdAt !== 'number') return false
	const trigger = item.trigger as Partial<{ kind: string; at: number; key: string; label: string }> | undefined
	if (!trigger) return false
	if (trigger.kind === 'time') return typeof trigger.at === 'number' && Number.isFinite(trigger.at)
	return trigger.kind === 'counter' && typeof trigger.key === 'string' && typeof trigger.label === 'string'
}

const toLocalInput = (timestamp: number): string => {
	const shifted = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60_000)
	return shifted.toISOString().slice(0, 16)
}

const describe = (item: Pending): string =>
	item.trigger.kind === 'time'
		? `At ${new Date(item.trigger.at).toLocaleString()}`
		: `When ${item.trigger.label} has units again`

const newId = (): string => `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export class SendWhenReadyFeature extends Feature {
	readonly id = 'send-when-ready'
	readonly name = 'Send When Ready'
	readonly description = 'Hold a message and send it at a chosen time, or when a quota counter has units again.'

	private readonly ledger = new QuotaLedger(storage)
	private readonly handled = new Set<string>()
	private busy = false
	private readonly button = new ComposerButton(
		'Send when ready',
		'clock',
		'Hold this message and send it later or when quota returns',
		() => this.open(),
		{ id: 'ready' }
	)

	override onEnable(): void {
		this.scope.interval(() => void this.tick(), TICK)
	}

	run(): void {
		if (this.enabled) this.button.mount()
		else this.button.unmount()
	}

	override onDisable(): void {
		this.button.unmount()
		const dialog = document.getElementById(`${uiConfig().id}-send-ready`)
		if (dialog instanceof HTMLDialogElement) dialog.close()
	}

	override menuEntries(): MenuEntry[] {
		return [{ id: 'open', label: 'Send When Ready…', action: () => this.open() }]
	}

	private load(): Pending[] {
		const raw = storage.get<unknown>(KEY, [])
		return Array.isArray(raw) ? raw.filter(valid) : []
	}

	private save(items: readonly Pending[]): void {
		storage.set(KEY, items)
	}

	private isDue(item: Pending, reports: readonly QuotaReport[], now: number): boolean {
		if (item.trigger.kind === 'time') return now >= item.trigger.at
		const key = item.trigger.key
		const report = reports.find((candidate) => candidate.key === key)
		return Boolean(report) && report!.remaining > 0 && report!.observedAt > item.createdAt && now - report!.observedAt <= QUOTA_STALE_MS
	}

	private async tick(): Promise<void> {
		if (!this.enabled || this.busy || isGenerating()) return
		const items = this.load()
		if (!items.length) return
		const now = Date.now()
		const reports = this.ledger.reports(now)
		for (const item of items) {
			if (this.handled.has(item.id) || !this.isDue(item, reports, now)) continue
			if (item.path !== location.pathname) {
				this.handled.add(item.id)
				showToast('A scheduled message is waiting in another conversation.', [{ label: 'Open it', primary: true, onClick: () => location.assign(item.path) }], 12_000)
				continue
			}
			if (item.trigger.kind === 'time' && now - item.trigger.at > OVERDUE) {
				this.handled.add(item.id)
				showToast('A scheduled message is more than 30 minutes overdue. Send it now?', [
					{ label: 'Send now', primary: true, onClick: () => void this.dispatch(item) },
					{ label: 'Discard', onClick: () => this.remove(item.id) }
				], 0)
				continue
			}
			this.countdown(item)
			return
		}
	}

	private countdown(item: Pending): void {
		this.busy = true
		let settled = false
		let dismiss: () => void = () => undefined
		const finish = (send: boolean): void => {
			if (settled) return
			settled = true
			window.clearTimeout(timer)
			dismiss()
			if (send) {
				void this.dispatch(item)
				return
			}
			this.handled.add(item.id)
			this.busy = false
		}
		const timer = window.setTimeout(() => finish(true), COUNTDOWN)
		dismiss = showToast(`Sending your scheduled message in ${COUNTDOWN / 1000} seconds.`, [
			{ label: 'Send now', primary: true, onClick: () => finish(true) },
			{ label: 'Keep waiting', onClick: () => finish(false) }
		], 0)
	}

	private async dispatch(item: Pending): Promise<void> {
		if (this.busy && !this.load().some((candidate) => candidate.id === item.id)) return
		this.busy = true
		this.remove(item.id)
		try {
			if (!(await sendPrompt(item.text))) throw new Error('Send failed')
		} catch {
			const composer = findComposer()
			if (composer && readComposer(composer).trim() === '') await writeComposer(composer, item.text)
			showToast('Could not send the scheduled message. It was put back in the composer.')
		} finally {
			this.busy = false
		}
	}

	private remove(id: string): void {
		this.save(this.load().filter((item) => item.id !== id))
	}

	private open(): void {
		const id = `${uiConfig().id}-send-ready`
		const existing = document.getElementById(id)
		if (existing instanceof HTMLDialogElement) {
			existing.close()
			return
		}
		injectStyle(id, CSS)
		const ui = createDialog({ id, title: 'Send when ready', description: 'Hold a message and send it later. This tab must stay open.', width: 640 })
		const composer = findComposer()
		let draft = composer ? readComposer(composer).trim() : ''
		const area = createTextArea('Message to send', draft, (value) => {
			draft = value
		})
		area.rows = 6
		const empty = this.ledger.reports().filter((report) => report.remaining === 0)
		const mode = createElement('select', 'bp-input')
		for (const [value, label] of [['time', 'At a specific time'], ['counter', empty.length ? 'When a counter has units again' : 'When a counter has units again (no empty counter now)']] as const) {
			const option = createElement('option', undefined, label)
			option.value = value
			if (value === 'counter' && !empty.length) option.disabled = true
			mode.appendChild(option)
		}
		const time = createElement('input', 'bp-input')
		time.type = 'datetime-local'
		const soon = new Date(Date.now() + 3_600_000)
		soon.setSeconds(0, 0)
		time.value = toLocalInput(soon.getTime())
		const counter = createElement('select', 'bp-input')
		for (const report of empty) {
			const option = createElement('option', undefined, report.label)
			option.value = report.key
			counter.appendChild(option)
		}
		const hint = createElement('p', 'bp-hint')
		const status = createElement('p', 'bp-hint')
		status.setAttribute('role', 'status')
		const timeRow = createElement('label', 'bp-srd-row')
		timeRow.append(createElement('span', undefined, 'Send at'), time)
		const counterRow = createElement('label', 'bp-srd-row')
		counterRow.append(createElement('span', undefined, 'Counter to wait for'), counter)
		const syncMode = (): void => {
			const byTime = mode.value === 'time'
			timeRow.hidden = !byTime
			counterRow.hidden = byTime
			const report = empty.find((candidate) => candidate.key === counter.value)
			const next = report?.forecast?.nextAt ?? null
			hint.textContent = byTime ? '' : next ? `Estimated next unit about ${new Date(next).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. It is an estimate, and the message waits for a real increase.` : 'No estimate yet. The message waits for a real increase in the counter.'
		}
		mode.addEventListener('change', syncMode)
		counter.addEventListener('change', syncMode)
		syncMode()
		const list = createElement('div', 'bp-srd')
		const renderList = (): void => {
			const items = this.load()
			list.replaceChildren(...items.map((item) => {
				const row = createElement('div', 'bp-srd-item')
				const text = createElement('div', 'bp-srd-item-text')
				text.append(createElement('strong', undefined, item.text.slice(0, 80)), createElement('span', undefined, describe(item)))
				const actions = createElement('div', 'bp-srd-item-actions')
				actions.append(
					createButton('Send now', { onClick: () => void this.dispatch(item).then(renderList) }),
					createButton('Remove', { onClick: () => { this.remove(item.id); renderList() } })
				)
				row.append(text, actions)
				return row
			}))
			if (!items.length) list.appendChild(createElement('p', 'bp-hint', 'Nothing is waiting.'))
		}
		const schedule = (): void => {
			const text = draft.trim()
			const items = this.load()
			if (!text) {
				status.textContent = 'Write a message first.'
				return
			}
			if (text.length > MAX_TEXT) {
				status.textContent = `Messages are limited to ${MAX_TEXT.toLocaleString()} characters.`
				return
			}
			if (items.length >= MAX_PENDING) {
				status.textContent = `You can hold at most ${MAX_PENDING} messages.`
				return
			}
			let trigger: Trigger
			if (mode.value === 'time') {
				const at = new Date(time.value).getTime()
				if (!Number.isFinite(at) || at <= Date.now()) {
					status.textContent = 'Pick a time in the future.'
					return
				}
				trigger = { kind: 'time', at }
			} else {
				const report = empty.find((candidate) => candidate.key === counter.value)
				if (!report) {
					status.textContent = 'Pick an empty counter.'
					return
				}
				trigger = { kind: 'counter', key: report.key, label: report.label }
			}
			this.save([...items, { id: newId(), text, path: location.pathname, createdAt: Date.now(), trigger }])
			const live = findComposer()
			if (live && readComposer(live).trim() === text) void writeComposer(live, '')
			status.textContent = 'Scheduled. Keep this tab open.'
			renderList()
		}
		const form = createElement('div', 'bp-srd')
		form.append(area, createElement('label', 'bp-srd-row', ''), timeRow, counterRow, hint)
		const modeRow = createElement('label', 'bp-srd-row')
		modeRow.append(createElement('span', undefined, 'When'), mode)
		form.replaceChildren(area, modeRow, timeRow, counterRow, hint, createButton('Schedule', { primary: true, onClick: schedule }), status, list)
		ui.body.appendChild(form)
		ui.footer.append(createButton('Close', { onClick: ui.close }))
		renderList()
		ui.show()
	}
}
