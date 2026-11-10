import { createElement, Feature, type MenuEntry, type ScriptContext } from '@nolly/core'
import { markUi } from '../../core/dom'
import { createIcon, ensureUiStyles, Tooltip } from '@nolly/ai'
import { toggleGlobalSettings } from './dialog'
import { ensureGearStyles } from './styles'

const INDICATOR_SELECTOR = '.bp-usage-indicator'

export class GlobalSettingsModule extends Feature {
  readonly id = 'global-settings'
  readonly name = 'Settings Button'
  readonly description = 'Adds a settings button next to the usage badge.'

  private readonly button = markUi(createElement('button', 'bp-header-btn bp-gear'))
  private readonly tooltip: Tooltip

  constructor(context: ScriptContext) {
    super(context)
    ensureUiStyles()
    ensureGearStyles()
    this.button.type = 'button'
    this.button.setAttribute('aria-label', 'Better Perplexity settings')
    this.button.appendChild(createIcon('sliders'))
    this.button.addEventListener('click', () => this.open())
    this.tooltip = new Tooltip(this.button, (container) => container.append(createElement('div', 'bp-tip-mode', 'Better Perplexity'), createElement('div', 'bp-tip-sub', 'Modules and settings')))
  }

  run(): void {
    const indicator = document.querySelector<HTMLElement>(INDICATOR_SELECTOR)
    if (!this.enabled || !indicator) {
      this.tooltip.hide()
      this.button.remove()
      return
    }
    if (this.button.parentElement !== indicator) indicator.appendChild(this.button)
  }

  override menuEntries(): MenuEntry[] {
    return [{ id: 'open', label: 'Open Better Perplexity Settings', action: () => this.open() }]
  }

  private open(): void {
    toggleGlobalSettings(this.context)
  }
}