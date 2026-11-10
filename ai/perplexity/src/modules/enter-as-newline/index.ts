import { isSynthetic } from '@nolly/ai'
import { Feature, type MenuEntry } from '@nolly/core'
import { logger } from '../../core/logger'
import { ConfigButton } from './config-button'
import { toggleShortcutsDialog } from './dialog'
import { getEditableTarget, insertNewline, isComposing, sendMessage } from './keyboard'
import { describeShortcuts, hasModifier, loadShortcuts, matchesShortcut, saveShortcuts, type ShortcutSettings } from './shortcuts'

export class EnterAsNewlineModule extends Feature {
  readonly id = 'enter-as-newline'
  readonly name = 'Enter as Newline'
  readonly description = 'Use Enter for newlines and configurable shortcuts to send messages.'

  private shortcuts: ShortcutSettings = loadShortcuts()
  private attached = false
  private readonly configButton = new ConfigButton(
    () => this.configure(),
    () => describeShortcuts(this.shortcuts)
  )

  run(): void {
    if (this.enabled) this.configButton.mount()
    else this.configButton.unmount()
    if (this.enabled && !this.attached) {
      window.addEventListener('keydown', this.handleKeydown, true)
      this.attached = true
      logger.success('Enter as Newline listener registered.')
      return
    }
    if (!this.enabled && this.attached) {
      window.removeEventListener('keydown', this.handleKeydown, true)
      this.attached = false
      logger.info('Enter as Newline listener removed.')
    }
  }

  override menuEntries(): MenuEntry[] {
    return [{ label: 'Configure Enter as Newline', action: () => this.configure() }]
  }

  private configure(): void {
    toggleShortcutsDialog(this.shortcuts, (settings) => {
      this.shortcuts = settings
      saveShortcuts(settings)
    })
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' || isComposing(event) || isSynthetic(event)) return
    const editable = getEditableTarget(event)
    if (!editable) return
    if (matchesShortcut(event, this.shortcuts)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      sendMessage(editable)
      return
    }
    if (hasModifier(event)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    insertNewline(editable)
  }
}
