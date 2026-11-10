import { Feature } from '@nolly/core'
import type { MenuEntry, ScriptContext } from '@nolly/core'
import { isSynthetic } from '../../keys'
import { platform, storage } from '../../platform'
import { ConfigButton } from './config-button'
import { toggleShortcutsDialog } from './dialog'
import { defaultSend, getEditableTarget, insertNewline, isComposing } from './keyboard'
import { describeShortcuts, hasModifier, loadShortcuts, matchesShortcut, saveShortcuts } from './shortcuts'
import type { ShortcutSettings } from './shortcuts'

export class EnterAsNewlineFeature extends Feature {
  readonly id = 'enter-as-newline'
  readonly name = 'Enter as Newline'
  readonly description = 'Use Enter for newlines and configurable shortcuts to send messages.'

  private shortcuts: ShortcutSettings
  private attached = false
  private readonly configButton: ConfigButton

  constructor(context: ScriptContext) {
    super(context)
    this.shortcuts = loadShortcuts(storage)
    this.configButton = new ConfigButton(
      () => this.configure(),
      () => describeShortcuts(this.shortcuts)
    )
  }

  run(): void {
    if (this.enabled) this.configButton.mount()
    else this.configButton.unmount()
    if (this.enabled && !this.attached) {
      window.addEventListener('keydown', this.handleKeydown, true)
      this.attached = true
      this.context.logger.success('Enter as Newline listener registered.')
      return
    }
    if (!this.enabled && this.attached) {
      window.removeEventListener('keydown', this.handleKeydown, true)
      this.attached = false
      this.context.logger.info('Enter as Newline listener removed.')
    }
  }

  override menuEntries(): MenuEntry[] {
    return [{ label: 'Configure Enter as Newline', action: () => this.configure() }]
  }

  private configure(): void {
    toggleShortcutsDialog(
      this.shortcuts,
      (settings) => {
        this.shortcuts = settings
        saveShortcuts(storage, settings)
      },
      this.context.logger
    )
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' || isComposing(event) || isSynthetic(event)) return
    const editable = getEditableTarget(event, platform().rejectEditable)
    if (!editable) return
    if (matchesShortcut(event, this.shortcuts)) {
      event.preventDefault()
      event.stopImmediatePropagation()
			const sendDefault = this.options.send ?? defaultSend
      sendDefault(editable)
      return
    }
    if (hasModifier(event)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    insertNewline(editable)
  }
}
