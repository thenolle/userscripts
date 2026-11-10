import { Tooltip, createIcon, ensureUiStyles } from '@nolly/ai'
import { Feature, createElement } from '@nolly/core'
import { ICON_BUTTON_CLASS } from '../header-style'
import { placeTool } from '../header-tools'

export class HeaderButtonFeature extends Feature {
  readonly id = 'header-button'
  readonly name = 'Header button'
  readonly description = 'Adds the Better ChatGPT settings button to the header.'

  private button: HTMLButtonElement | null = null
  private tooltip: Tooltip | null = null

  run(): void {
    if (!this.enabled) return
    if (!this.button) this.build()
    if (this.button) placeTool(this.button, 'settings')
  }

  override onDisable(): void {
    this.tooltip?.destroy()
    this.tooltip = null
    this.button?.remove()
    this.button = null
  }

  private build(): void {
    ensureUiStyles()
    const button = createElement('button', ICON_BUTTON_CLASS)
    button.type = 'button'
    button.setAttribute('aria-label', 'Better ChatGPT settings')
    button.appendChild(createIcon('sliders', 20))
    button.addEventListener('click', () => this.context.openSettings())
    this.tooltip = new Tooltip(button, (container) => container.append(createElement('div', 'bp-tip-mode', 'Better ChatGPT'), createElement('div', 'bp-tip-sub', 'Settings')), { align: 'end' })
    this.button = button
  }
}
