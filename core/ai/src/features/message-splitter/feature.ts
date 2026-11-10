import { Feature, toElement, waitFor } from '@nolly/core'
import type { MenuEntry, ScriptContext, ScriptStorage } from '@nolly/core'
import { isAutomating } from '../../automation'
import { isSendButton, readComposer } from '../../composer'
import type { ComposerKit } from '../../composer'
import type { GenerationKit } from '../../generation'
import { estimateTokens } from '../../tokens'
import { uiConfig } from '../../ui/config'
import { ComposerButton } from '../../ui/composer-button'
import { openBigTextDialog } from './big-text'
import { ProgressPanel, openSplitDialog } from './dialog'
import type { SplitChoice } from './dialog'
import { SendRunner } from './runner'
import { loadSplitterSettings, saveSplitterSettings } from './settings'
import type { SplitterSettings } from './settings'

export interface MessageSplitterOptions {
  readonly storage: ScriptStorage
  readonly composer: ComposerKit
  readonly generation: Pick<GenerationKit, 'waitForResponse'>
  readonly defaults?: Partial<SplitterSettings>
  readonly attachBlocked?: () => string | null
}

export class MessageSplitterFeature extends Feature {
  readonly id = 'message-splitter'
  readonly name = 'Message Splitter'
  readonly description = 'Splits oversized prompts into ordered parts, or attaches them as a file.'

  private settings: SplitterSettings
  private readonly runner: SendRunner
  private readonly panel = new ProgressPanel()
  private attached = false
  private readonly bigButton = new ComposerButton('Compose big message', 'file', 'Paste a large message. It is split only if needed.', () => this.openBig(), { id: 'big' })

  constructor(context: ScriptContext, private readonly options: MessageSplitterOptions) {
    super(context)
    this.settings = loadSplitterSettings(options.storage, options.defaults)
    this.runner = new SendRunner({ composer: options.composer, waitForResponse: options.generation.waitForResponse, logger: context.logger })
  }

  run(): void {
    if (this.enabled) this.bigButton.mount()
    else this.bigButton.unmount()
    if (this.enabled && !this.attached) {
      document.addEventListener('keydown', this.handleKeydown, true)
      document.addEventListener('click', this.handleClick, true)
      this.attached = true
      return
    }
    if (!this.enabled && this.attached) {
      document.removeEventListener('keydown', this.handleKeydown, true)
      document.removeEventListener('click', this.handleClick, true)
      this.attached = false
    }
  }

  override menuEntries(): MenuEntry[] {
    return [
      { id: 'big', label: 'Compose Big Message…', action: () => this.openBig() },
      { id: 'split', label: 'Split Composer Text…', action: () => this.open() },
      { label: `${this.settings.autoIntercept ? 'Disable' : 'Enable'} Auto-Split on Send`, action: () => this.saveSettings({ ...this.settings, autoIntercept: !this.settings.autoIntercept }) }
    ]
  }

  private saveSettings(settings: SplitterSettings): void {
    this.settings = settings
    saveSplitterSettings(this.options.storage, settings)
    this.context.refreshMenu()
  }

  private isOwn(element: Element): boolean {
    return uiConfig().marker.isOwn(element)
  }

  private isOversized(editable: HTMLElement): boolean {
    return this.settings.autoIntercept && estimateTokens(readComposer(editable)) > this.settings.limit
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (this.runner.active || isAutomating() || event.key !== 'Enter' || event.shiftKey || event.isComposing) return
    const editable = this.options.composer.editableFrom(event.target)
    if (!editable || this.isOwn(editable) || !this.isOversized(editable)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    this.open()
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.runner.active || isAutomating() || !this.settings.autoIntercept) return
    const button = toElement(event.target)?.closest('button')
    if (!button || this.isOwn(button) || !isSendButton(button)) return
    const composer = this.options.composer.findComposer()
    if (!composer || !this.isOversized(composer)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    this.open()
  }

  private open(): void {
    const composer = this.options.composer.findComposer()
    const text = composer ? readComposer(composer) : ''
    if (!text.trim()) {
      this.panel.notify('The composer is empty.')
      return
    }
    openSplitDialog({
      text,
      settings: this.settings,
      onSettings: (settings) => this.saveSettings(settings),
      onConfirm: (choice) => void this.execute(text, choice)
    })
  }

  private async execute(text: string, { mode, plan, instruction }: SplitChoice): Promise<void> {
    if (mode === 'file') {
      await this.attachAsFile(text, instruction)
      return
    }
    const total = plan.parts.length
    this.panel.show(total, () => this.runner.cancel())
    const result = await this.runner.run(plan.parts, (index, status) => this.panel.update(index, total, status))
    this.panel.finish(result === 'done' ? 'All parts sent.' : result === 'cancelled' ? 'Cancelled.' : 'Stopped: a part could not be written or sent.')
  }

  private async attachAsFile(text: string, instruction: string): Promise<void> {
    const blocked = this.options.attachBlocked?.()
    if (blocked) {
      this.panel.notify(blocked)
      return
    }
    const composer = this.options.composer.findComposer()
    if (!composer) {
      this.panel.notify('No composer found.')
      return
    }
    const attached = this.options.composer.attachFile(composer, new File([text], 'message.txt', { type: 'text/plain' }))
    await this.options.composer.writeComposer(composer, instruction.trim())
    this.panel.notify(attached ? 'File attached. Add your question and send.' : 'Could not attach the file automatically.')
  }

  private openBig(): void {
    openBigTextDialog({
      settings: this.settings,
      onSettings: (settings) => this.saveSettings(settings),
      onInsert: (text) => void this.insert(text),
      onSend: (text, choice) => void this.execute(text, choice)
    })
  }

  private async insert(text: string): Promise<void> {
    const composer = await waitFor(this.options.composer.findComposer, { timeout: 5_000 })
    if (!composer) {
      this.panel.notify('No composer found.')
      return
    }
    this.panel.notify((await this.options.composer.writeComposer(composer, text)) ? 'Inserted into the composer.' : 'Could not insert the text.')
  }
}
