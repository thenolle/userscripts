import { createElement, Feature, type MenuEntry, type ScriptContext } from '@nolly/core'
import { markUi } from '../../core/dom'
import { createIcon, ensureUiStyles, Tooltip } from '@nolly/ai'
import { currentThreadSlug } from './api'
import { toggleExportDialog } from './dialog'
import { loadExportSettings, saveExportSettings, type ExportSettings } from './settings'

const INDICATOR_SELECTOR = '.bp-usage-indicator'
const GEAR_SELECTOR = '.bp-gear'

export class ExporterModule extends Feature {
  readonly id = 'exporter'
  readonly name = 'Conversation Exporter'
  readonly description = 'Exports threads with configurable citation styles.'

  private settings: ExportSettings = loadExportSettings()
  private readonly button = markUi(createElement('button', 'bp-header-btn bp-export'))
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
    const indicator = document.querySelector<HTMLElement>(INDICATOR_SELECTOR)
    if (!this.enabled || !indicator || !currentThreadSlug()) {
      this.tooltip.hide()
      this.button.remove()
      return
    }
    const gear = indicator.querySelector(GEAR_SELECTOR)
    if (this.button.parentElement !== indicator || (gear && this.button.nextElementSibling !== gear)) indicator.insertBefore(this.button, gear)
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