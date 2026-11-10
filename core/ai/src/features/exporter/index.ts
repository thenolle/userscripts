import { Feature, createElement } from '@nolly/core'
import type { MenuEntry, ScriptContext } from '@nolly/core'
import { platform } from '../../platform'
import { markUi } from '../../ui/config'
import { createIcon } from '../../ui/icons'
import { ensureUiStyles } from '../../ui/styles'
import { Tooltip } from '../../ui/tooltip'
import { toggleExportDialog } from './dialog'
import { loadExportSettings, saveExportSettings } from './settings'
import type { ExportSettings } from './settings'

export class ExporterFeature extends Feature {
  readonly id = 'exporter'
  readonly name = 'Conversation Exporter'
  readonly description = 'Exports threads with configurable citation styles.'

  private settings: ExportSettings = loadExportSettings()
  private readonly button = markUi(createElement('button', 'bp-header-btn bp-export bp-themed'))
  private readonly tooltip: Tooltip

  constructor(context: ScriptContext) {
    super(context)
    ensureUiStyles()
    this.button.type = 'button'
    this.button.setAttribute('aria-label', 'Export thread')
    this.button.appendChild(createIcon('download'))
    this.button.addEventListener('click', () => this.open())
    this.tooltip = new Tooltip(this.button, (container) => container.append(createElement('div', 'bp-tip-mode', 'Export thread'), createElement('div', 'bp-tip-sub', 'Markdown, Word, PDF or raw JSON')))
  }

  run(): void {
    const source = platform().exporter
    if (!this.enabled || !source.slug() || !source.place(this.button)) {
      this.tooltip.hide()
      this.button.remove()
    }
  }

  override menuEntries(): MenuEntry[] {
    return [{ id: 'export', label: 'Export Thread…', action: () => this.open() }]
  }

  private open(): void {
    toggleExportDialog(this.settings, (settings) => {
      this.settings = settings
      saveExportSettings(settings)
    })
  }
}
