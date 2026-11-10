import { Feature, toElement, type MenuEntry, type ScriptContext } from '@nolly/core'
import { isAutomating } from '../../automation'
import { copyText } from '../../clipboard'
import { isSendButton, readComposer } from '../../composer'
import { saveFile } from '../../download'
import { ComposerButton } from '../../ui/composer-button'
import { showToast } from '../../ui/toast'
import { editableFrom, findComposer, sendComposer, writeComposer, platform, storage } from '../../platform'
import { isOwnUi, uiConfig } from '../../ui/config'
import { toggleShortcutDialog } from '../command-palette/dialog'
import { matchesShortcut, type Shortcut } from '../command-palette/shortcut'
import { promptQueue, threadOf } from '../prompt-queue/queue'
import { caretAtEnd, caretAtStart } from './caret'
import { HistoryCursor } from './cursor'
import { toggleRecall } from './dialog'
import { history, recordPrompt } from './history'
import { SendRecorder } from './recorder'
import { DEFAULT_RECALL_SHORTCUT, loadRecallSettings, loadRecallShortcut, RECALL_SHORTCUT_KEY, saveRecallSettings } from './settings'

export class RecallFeature extends Feature {
	readonly id = 'recall'
	readonly name = 'Recall'
	readonly description = 'Searchable history of the messages you send, with one-key reuse and arrow-key recall.'

	private shortcut: Shortcut = loadRecallShortcut()
	private readonly cursor = new HistoryCursor(() => history.recent(100).map((entry) => entry.text))
	private readonly recorder = new SendRecorder({
		now: Date.now,
		composerText: () => {
			const composer = findComposer()
			return composer ? readComposer(composer) : null
		},
		isAutomating,
		commit: (text) => recordPrompt(text)
	})
	private readonly button = new ComposerButton('Recall', 'clock', 'Search the messages you sent before', () => this.open(), { id: 'recall', after: ['queue', 'batch', 'prompts', 'big'] })

	constructor(context: ScriptContext) {
		super(context)
	}

	override onEnable(): void {
		history.prune(loadRecallSettings().retentionDays)
		this.scope.listen(window, 'keydown', this.onKeydown as EventListener, { capture: true })
		this.scope.listen(document, 'click', this.onClick as EventListener, { capture: true })
		this.scope.add(platform().onSend(() => this.recorder.request()))
		this.scope.interval(() => this.recorder.tick(), 250)
	}

	run(): void {
		if (this.enabled) this.button.mount()
		else this.button.unmount()
	}

	override menuEntries(): MenuEntry[] {
		const settings = loadRecallSettings()
		return [
			{ id: 'open', label: 'Open Recall…', action: () => this.open() },
			{ id: 'pause', label: settings.paused ? 'Resume Recording' : 'Pause Recording', action: () => this.update({ paused: !settings.paused }) },
			{ id: 'arrows', label: `Turn Arrow-Key History ${settings.arrowHistory ? 'Off' : 'On'}`, action: () => this.update({ arrowHistory: !settings.arrowHistory }) },
			{ id: 'retention', label: 'Set History Retention…', action: () => this.setRetention() },
			{ id: 'export', label: 'Export History…', action: () => saveFile(`${uiConfig().id}-history.json`, history.exportJson(), 'application/json') },
			{ id: 'import', label: 'Import History…', action: () => this.importFile() },
			{ id: 'clear', label: 'Clear History…', action: () => this.clear() },
			{ id: 'shortcut', label: 'Configure Recall Shortcut', action: () => this.configure() }
		]
	}

	private open(): void {
		toggleRecall({
			store: history,
			insert: (text) => void this.insert(text),
			send: (text) => void this.send(text),
			queue: storage.get('module:prompt-queue', true) ? (text) => this.enqueue(text) : null
		})
	}

	private async insert(text: string): Promise<void> {
		const composer = findComposer()
		if (composer && (await writeComposer(composer, text))) {
			composer.focus()
			return
		}
		await copyText(text)
		showToast('There is no message box on this page, so the message was copied instead.')
	}

	private async send(text: string): Promise<void> {
		const composer = findComposer()
		if (composer && (await writeComposer(composer, text))) {
			await sendComposer(composer)
			return
		}
		await copyText(text)
		showToast('There is no message box on this page, so the message was copied instead.')
	}

	private enqueue(text: string): void {
		const item = promptQueue.add(text, threadOf(location.pathname))
		showToast(item ? `Queued as #${promptQueue.size}.` : 'The queue is full.', [], 3_000)
	}

	private update(patch: Partial<ReturnType<typeof loadRecallSettings>>): void {
		saveRecallSettings({ ...loadRecallSettings(), ...patch })
		this.context.refreshMenu()
	}

	private setRetention(): void {
		const current = loadRecallSettings().retentionDays
		const raw = window.prompt('Keep history for how many days? Use 0 to keep it forever. Pinned messages are always kept.', String(current))
		if (raw === null) return
		const days = Math.max(0, Math.min(3650, Math.round(Number(raw))))
		if (!Number.isFinite(days)) return
		this.update({ retentionDays: days })
		const removed = history.prune(days)
		showToast(days === 0 ? 'History is kept forever.' : `History is kept for ${days} days${removed ? ` (${removed} older messages removed)` : ''}.`)
	}

	private importFile(): void {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'application/json,.json'
		input.addEventListener('change', () => {
			const file = input.files?.[0]
			if (!file) return
			void file.text().then((json) => {
				const result = history.importJson(json)
				showToast(`Imported ${result.added} new and ${result.merged} existing messages${result.skipped ? `, skipped ${result.skipped}` : ''}.`)
			})
		})
		input.click()
	}

	private clear(): void {
		if (!window.confirm(`Delete ${history.size} remembered messages? Pinned messages are kept.`)) return
		history.clear(true)
		showToast('History cleared.', [], 3_000)
	}

	private configure(): void {
		toggleShortcutDialog(
			this.shortcut,
			(shortcut) => {
				this.shortcut = shortcut
				storage.set(RECALL_SHORTCUT_KEY, shortcut)
			},
			'Recall shortcut',
			DEFAULT_RECALL_SHORTCUT
		)
	}

	private readonly onKeydown = (event: KeyboardEvent): void => {
		if (!this.enabled) return
		if (!event.repeat && matchesShortcut(event, this.shortcut)) {
			event.preventDefault()
			event.stopImmediatePropagation()
			this.open()
			return
		}
		if (event.isComposing) return
		const composer = findComposer()
		if (!composer || editableFrom(event.target) !== composer) return
		if (event.key === 'Enter' && !event.shiftKey) {
			this.recorder.intent(readComposer(composer))
			return
		}
		const plain = !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey
		if (plain && loadRecallSettings().arrowHistory && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) this.navigate(event, composer)
	}

	private navigate(event: KeyboardEvent, composer: HTMLElement): void {
		const text = readComposer(composer)
		const next = event.key === 'ArrowUp' ? this.cursor.previous(text, caretAtStart(composer)) : this.cursor.next(text, caretAtEnd(composer))
		if (next === null) return
		event.preventDefault()
		event.stopImmediatePropagation()
		void writeComposer(composer, next)
	}

	private readonly onClick = (event: MouseEvent): void => {
		if (!this.enabled) return
		const button = toElement(event.target)?.closest('button')
		if (!button || isOwnUi(button) || !isSendButton(button)) return
		const composer = findComposer()
		if (composer) this.recorder.intent(readComposer(composer))
	}
}
