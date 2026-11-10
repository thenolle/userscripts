import { Feature, createElement, injectStyle } from '@nolly/core'
import type { MenuEntry } from '@nolly/core'
import { copyText } from '../../clipboard'
import { saveFile } from '../../download'
import { storage } from '../../platform'
import { ComposerButton } from '../../ui/composer-button'
import { uiConfig } from '../../ui/config'
import { createButton } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import { compareAnswers, diffText } from './compare'
import type { DiffResult } from './compare'

interface Baseline {
	readonly text: string
	readonly url: string
	readonly at: number
}

const KEY = 'answer-diff:baseline'
const MAX_CHARS = 100_000

const CSS = `
.bp-answer-editors { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bp-answer-editors label { display: flex; flex-direction: column; gap: 7px; font-size: 12px; font-weight: 600; }
.bp-answer-editors textarea { min-height: 220px; font-weight: 400; }
.bp-answer-diff {
	margin: 0;
	padding: 12px;
	max-height: 420px;
	overflow: auto;
	border: 1px solid var(--bp-border);
	border-radius: 8px;
	background: var(--bp-bg);
	color: var(--bp-fg);
	font: 12px/1.65 ui-monospace, monospace;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	tab-size: 4;
}
.bp-answer-diff .added { background: rgb(34 197 94 / 13%); }
.bp-answer-diff .removed { background: rgb(239 68 68 / 13%); }
.bp-answer-summary { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 600px) { .bp-answer-editors { grid-template-columns: 1fr; } }
`

const loadBaseline = (): Baseline | null => {
	const value = storage.get<unknown>(KEY, null)
	if (!value || typeof value !== 'object') return null
	const item = value as Partial<Baseline>
	return typeof item.text === 'string' && item.text.length <= MAX_CHARS && typeof item.url === 'string' && typeof item.at === 'number' && Number.isFinite(item.at) ? item as Baseline : null
}

export class AnswerDiffFeature extends Feature {
	readonly id = 'answer-diff'
	readonly name = 'Answer Diff'
	readonly description = 'Compare two answers or code revisions locally, with an explicitly saved baseline.'

	private selection = ''
	private readonly button = new ComposerButton('Answer diff', 'layers', 'See exactly what changed between two answers', () => this.open(), { id: 'diff' })

	override onEnable(): void {
		this.scope.listen(document, 'selectionchange', () => {
			const selection = window.getSelection()
			const anchor = selection?.anchorNode
			const host = anchor instanceof Element ? anchor : anchor?.parentElement
			if (!host || uiConfig().marker.isOwn(host)) return
			if (host.closest('input, textarea, [contenteditable], dialog')) return
			const text = selection?.toString() ?? ''
			if (text.trim()) this.selection = text
		})
	}

	run(): void {
		if (this.enabled) this.button.mount()
		else this.button.unmount()
	}

	override onDisable(): void {
		this.button.unmount()
		this.selection = ''
		const dialog = document.getElementById(`${uiConfig().id}-answer-diff`)
		if (dialog instanceof HTMLDialogElement) dialog.close()
	}

	override menuEntries(): MenuEntry[] {
		return [{ id: 'open', label: 'Compare Answers', action: () => this.open() }]
	}

	private open(): void {
		const id = `${uiConfig().id}-answer-diff`
		const existing = document.getElementById(id)
		if (existing instanceof HTMLDialogElement) {
			existing.close()
			return
		}
		injectStyle(`${uiConfig().id}-answer-diff`, CSS)
		const ui = createDialog({ id, title: 'Answer diff', description: 'Compare exact text changes. Nothing is sent; only an explicitly saved baseline persists.', width: 900 })
		const baseline = loadBaseline()
		const before = createElement('textarea', 'bp-input')
		const after = createElement('textarea', 'bp-input')
		before.value = baseline?.text ?? ''
		after.value = this.selection.length <= MAX_CHARS ? this.selection : ''
		before.maxLength = MAX_CHARS
		after.maxLength = MAX_CHARS
		before.spellcheck = false
		after.spellcheck = false
		const left = createElement('label')
		left.append(createElement('span', undefined, 'Baseline'), before)
		const right = createElement('label')
		right.append(createElement('span', undefined, 'Revision'), after)
		const editors = createElement('div', 'bp-answer-editors')
		editors.dataset['diffEditors'] = ''
		editors.append(left, right)
		const metadata = createElement('p', 'bp-hint', baseline ? `Saved baseline: ${baseline.url} · ${new Date(baseline.at).toLocaleString()}` : 'Select an answer before opening, or paste text into either side.')
		const summary = createElement('div', 'bp-answer-summary')
		const output = createElement('pre', 'bp-answer-diff')
		output.dataset['diffOutput'] = ''
		const status = createElement('div', 'bp-hint')
		status.setAttribute('role', 'status')
		let result: DiffResult | null = null
		const copy = createButton('Copy comparison')
		const download = createButton('Download comparison')
		copy.disabled = true
		download.disabled = true
		const invalidate = (): void => {
			result = null
			copy.disabled = true
			download.disabled = true
			output.textContent = 'Text changed. Compare again to update the result.'
			summary.replaceChildren()
		}
		before.addEventListener('input', invalidate)
		after.addEventListener('input', invalidate)
		const compare = (): void => {
			if (before.value.length > MAX_CHARS || after.value.length > MAX_CHARS) {
				status.textContent = `Each side is limited to ${MAX_CHARS.toLocaleString()} characters.`
				return
			}
			result = compareAnswers(before.value, after.value)
			summary.replaceChildren(
				createElement('span', 'bp-badge healthy', `+${result.added} added`),
				createElement('span', 'bp-badge empty', `−${result.removed} removed`),
				createElement('span', 'bp-badge', `${result.same} unchanged`)
			)
			const fragment = document.createDocumentFragment()
			result.lines.forEach((line, index) => {
				if (index) fragment.appendChild(document.createTextNode('\n'))
				const span = createElement('span', line.kind, `${line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' '}${line.text}`)
				fragment.appendChild(span)
			})
			output.replaceChildren(fragment)
			status.textContent = result.coarse ? 'Large changed region: coarse replacement comparison. Common prefix and suffix remain exact.' : 'Exact line comparison. Line endings are normalized; differences do not indicate factual correctness.'
			copy.disabled = false
			download.disabled = false
		}
		const save = createButton('Save baseline', {
			onClick: () => {
				if (before.value.length > MAX_CHARS) return
				if (loadBaseline() && !window.confirm('Replace the saved Answer Diff baseline?')) return
				const url = new URL(location.href)
				url.search = ''
				url.hash = ''
				const saved: Baseline = { text: before.value, url: url.href, at: Date.now() }
				storage.set(KEY, saved)
				metadata.textContent = `Saved baseline: ${saved.url} · ${new Date(saved.at).toLocaleString()}`
				status.textContent = 'Baseline saved locally. Temporary-chat content also persists if explicitly saved.'
			}
		})
		const clear = createButton('Delete saved baseline', {
			onClick: () => {
				if (!window.confirm('Delete the locally saved Answer Diff baseline?')) return
				storage.set(KEY, null)
				metadata.textContent = 'No saved baseline. Editor text has not been deleted.'
			}
		})
		copy.addEventListener('click', () => {
			if (!result) return
			void copyText(diffText(result)).then((ok) => {
				status.textContent = ok ? 'Comparison copied.' : 'Could not copy.'
			})
		})
		download.addEventListener('click', () => {
			if (result) saveFile('answer-comparison.diff', diffText(result))
		})
		const actions = createElement('div', 'bp-actions')
		actions.append(createButton('Compare', { primary: true, onClick: compare }), save, clear)
		ui.body.append(editors, metadata, actions, summary, output, status)
		ui.footer.append(createButton('Close', { onClick: ui.close }), copy, download)
		ui.show()
		compare()
	}
}
