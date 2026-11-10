import { findComposer, writeComposer } from '../../core/composer'
import { copyText } from '@nolly/ai'
import { Feature, type FeatureCommand, type MenuEntry } from '@nolly/core'
import { toggleShortcutDialog } from './dialog'
import { togglePalette } from './palette'
import { loadShortcut, matchesShortcut, saveShortcut, type Shortcut } from './shortcut'

export class CommandPaletteModule extends Feature {
  readonly id = 'command-palette'
  readonly name = 'Command Palette'
  readonly description = 'Search and run any action with a keyboard shortcut.'

  private shortcut: Shortcut = loadShortcut()
  private attached = false

  run(): void {
    if (this.enabled && !this.attached) {
      window.addEventListener('keydown', this.handleKeydown, true)
      this.attached = true
      return
    }
    if (!this.enabled && this.attached) {
      window.removeEventListener('keydown', this.handleKeydown, true)
      this.attached = false
    }
  }

  override menuEntries(): MenuEntry[] {
    return [
      { id: 'open', label: 'Open Command Palette', action: () => this.open() },
      { id: 'shortcut', label: 'Configure Palette Shortcut', action: () => this.configure() }
    ]
  }

  override commands(): FeatureCommand[] {
    return [
      { id: 'focus-input', title: 'Focus message input', run: () => findComposer()?.focus() },
      { id: 'clear-input', title: 'Clear message input', run: () => void this.clearInput() },
      { id: 'scroll-top', title: 'Scroll to top', keywords: 'beginning start', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
      { id: 'scroll-bottom', title: 'Scroll to bottom', keywords: 'end latest', run: () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }) },
      { id: 'home', title: 'Go to home', keywords: 'new thread', run: () => location.assign('/') },
      { id: 'copy-url', title: 'Copy page URL', keywords: 'link share', run: () => void copyText(location.href) }
    ]
  }

  private open(): void {
    togglePalette(this.context.getCommands)
  }

  private configure(): void {
    toggleShortcutDialog(this.shortcut, (shortcut) => {
      this.shortcut = shortcut
      saveShortcut(shortcut)
    })
  }

  private async clearInput(): Promise<void> {
    const composer = findComposer()
    if (composer) await writeComposer(composer, '')
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.repeat || !matchesShortcut(event, this.shortcut)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    this.open()
  }
}