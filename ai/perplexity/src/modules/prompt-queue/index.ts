import { Feature, waitFor, type MenuEntry, type ScriptContext } from '@nolly/core'
import { findComposer, readComposer, sendComposer, writeComposer } from '../../core/composer'
import { sendPrompt } from '../../core/dispatch'
import { isGenerating, waitForResponse } from '../../core/generation'
import { storage } from '../../core/storage'
import { ComposerButton } from '../../ui/composer-button'
import { showToast } from '../../ui/toast'
import { toggleShortcutDialog } from '../command-palette/dialog'
import { matchesShortcut, type Shortcut } from '../command-palette/shortcut'
import { recordPrompt } from '../recall/history'
import { QueuePanel } from './panel'
import { MAX_ITEMS, promptQueue, threadOf } from './queue'
import { QueueRunner, type RunnerDeps } from './runner'
import { DEFAULT_QUEUE_SHORTCUT, loadQueueShortcut, QUEUE_SHORTCUT_KEY } from './shortcut'

const deps: RunnerDeps = {
  path: () => location.pathname,
  isGenerating,
  waitForResponse: (signal, startTimeout) => waitForResponse({ signal, startTimeout }),
  composerText: () => {
    const composer = findComposer()
    return composer ? readComposer(composer) : null
  },
  send: (text, signal) => sendPrompt(text, signal),
  settlePath: async (before, signal) => {
    await waitFor(() => location.pathname !== before || null, { timeout: 6_000, interval: 100, signal })
    return location.pathname
  },
  onSent: (text) => recordPrompt(text)
}

export class PromptQueueModule extends Feature {
  readonly id = 'prompt-queue'
  readonly name = 'Message Queue'
  readonly description = 'Queue follow-up messages while an answer is generating; they send one by one when it finishes.'

  private readonly runner = new QueueRunner(promptQueue, deps, true)
  private readonly panel = new QueuePanel(promptQueue, this.runner)
  private readonly button = new ComposerButton('Message queue', 'queue', 'Queue this message to send when the answer finishes', () => void this.enqueueFromComposer(), { id: 'queue', after: ['batch', 'prompts', 'big'] })
  private shortcut: Shortcut = loadQueueShortcut()
  private restored = this.runner.paused

  constructor(context: ScriptContext) {
    super(context)
  }

  override onEnable(): void {
    this.scope.listen(window, 'keydown', this.onKeydown as EventListener, { capture: true })
    this.scope.add(promptQueue.subscribe(() => this.refresh()))
    this.scope.add(this.runner.onChange(() => this.refresh()))
    this.scope.interval(() => this.runner.kick(), 1_000)
    this.scope.add(() => {
      this.runner.stop()
      this.panel.detach()
    })
    this.panel.render()
  }

  run(): void {
    if (this.enabled) this.button.mount()
    else this.button.unmount()
  }

  override menuEntries(): MenuEntry[] {
    const entries: MenuEntry[] = [{ id: 'add', label: 'Queue Current Message', action: () => void this.enqueueFromComposer() }]
    if (promptQueue.size > 0) {
      entries.push(
        { id: 'pause', label: this.runner.paused ? 'Resume Queue' : 'Pause Queue', action: () => (this.runner.paused ? this.runner.resume() : this.runner.pause()) },
        { id: 'clear', label: 'Clear Queue', action: () => promptQueue.clear() }
      )
    }
    entries.push({ id: 'shortcut', label: 'Configure Queue Shortcut', action: () => this.configure() })
    return entries
  }

  async enqueueFromComposer(): Promise<void> {
    const composer = findComposer()
    const text = composer ? readComposer(composer).trim() : ''
    if (!composer || !text) {
      showToast('Type a message first, then queue it.', [], 3_000)
      return
    }
    const idle = promptQueue.size === 0 && !this.runner.running && !isGenerating()
    if (idle) {
      await sendComposer(composer)
      return
    }
    const item = promptQueue.add(text, threadOf(location.pathname))
    if (!item) {
      showToast(`The queue is full (${MAX_ITEMS} messages).`)
      return
    }
    await writeComposer(composer, '')
    if (this.restored) {
      this.restored = false
      this.runner.resume()
    }
    showToast(`Queued as #${promptQueue.size}. It sends when the answer finishes.`, [{ label: 'Undo', onClick: () => void this.undo(item.id, text) }], 4_000)
    this.runner.kick()
  }

  private async undo(id: string, text: string): Promise<void> {
    promptQueue.remove(id)
    const composer = findComposer()
    if (composer && readComposer(composer).trim() === '') await writeComposer(composer, text)
  }

  private refresh(): void {
    this.panel.render()
    this.context.refreshMenu()
  }

  private configure(): void {
    toggleShortcutDialog(
      this.shortcut,
      (shortcut) => {
        this.shortcut = shortcut
        storage.set(QUEUE_SHORTCUT_KEY, shortcut)
      },
      'Queue shortcut',
      DEFAULT_QUEUE_SHORTCUT
    )
  }

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (!this.enabled || event.repeat || !matchesShortcut(event, this.shortcut)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    void this.enqueueFromComposer()
  }
}
