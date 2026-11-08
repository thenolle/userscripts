import { findComposer, writeComposer } from '../../core/composer'
import { FeatureModule, type AppContext, type MenuEntry } from '../../core/module'
import { storage } from '../../core/storage'
import { ComposerButton } from '../../ui/composer-button'
import { toggleShortcutDialog } from '../command-palette/dialog'
import { matchesShortcut, type Shortcut } from '../command-palette/shortcut'
import { toggleManager } from './manager'
import { togglePromptPicker } from './picker'
import { loadCommunity } from './remote'
import { loadPromptShortcut, PROMPT_SHORTCUT_KEY } from './shortcut'
import { PromptStore, type Prompt } from './store'
import { expandPrompt } from './variables'

export class PromptLibraryModule extends FeatureModule {
  readonly id = 'prompt-library'
  readonly name = 'Prompt Library'
  readonly description = 'Insert saved and community prompts from a button or shortcut.'

  private readonly store = new PromptStore()
  private shortcut: Shortcut = loadPromptShortcut()
  private readonly button = new ComposerButton('Prompt library', 'book', 'Insert a saved or community prompt', () => this.pick(), { id: 'prompts', after: ['big'] })

  constructor(context: AppContext) {
    super(context)
    window.addEventListener('keydown', this.handleKeydown, true)
  }

  run(): void {
    if (this.enabled) this.button.mount()
    else this.button.unmount()
  }

  override menuEntries(): MenuEntry[] {
    return [
      { id: 'pick', label: 'Open Prompt Picker', action: () => this.pick() },
      { id: 'manage', label: 'Manage Prompts…', action: () => this.manage() },
      { id: 'refresh', label: 'Refresh Community Prompts', action: () => void loadCommunity(true) },
      { id: 'shortcut', label: 'Configure Prompt Shortcut', action: () => this.configure() }
    ]
  }

  private pick(): void {
    togglePromptPicker({
      store: this.store,
      community: () => loadCommunity(),
      onPick: (prompt) => void this.insert(prompt),
      onSave: (prompt) => this.store.saveCopy(prompt),
      onManage: () => this.manage()
    })
  }

  private manage(): void {
    toggleManager(this.store, (prompt) => void this.insert(prompt))
  }

  private configure(): void {
    toggleShortcutDialog(this.shortcut, (shortcut) => {
      this.shortcut = shortcut
      storage.set(PROMPT_SHORTCUT_KEY, shortcut)
    }, 'Prompt shortcut')
  }

  private async insert(prompt: Prompt): Promise<void> {
    const body = await expandPrompt(prompt.body, prompt.title)
    const composer = findComposer()
    if (body === null || !composer) return
    await writeComposer(composer, body)
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (!this.enabled || event.repeat || !matchesShortcut(event, this.shortcut)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    this.pick()
  }
}