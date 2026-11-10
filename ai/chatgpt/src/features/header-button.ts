import { Tooltip, createIcon, ensureUiStyles } from '@nolly/ai'
import { Feature, createElement } from '@nolly/core'
import { markUi } from '../dom'
import { findHeaderSlot } from '../locate'

export class HeaderButtonFeature extends Feature {
  readonly id = 'header-button'
  readonly name = 'Header button'
  readonly description = 'Adds the Better ChatGPT settings button to the header.'

  private readonly wrapper = markUi(createElement('div', 'pointer-events-auto flex items-center no-drag shrink-0'))
  private tooltip: Tooltip | null = null

  run(): void {
    if (!this.enabled) return
    const slot = findHeaderSlot()
    if (!slot) return
    if (!this.tooltip) this.build()
    if (this.wrapper.parentElement !== slot || slot.firstElementChild !== this.wrapper) slot.prepend(this.wrapper)
  }

  override onDisable(): void {
    this.tooltip?.destroy()
    this.tooltip = null
    this.wrapper.replaceChildren()
    this.wrapper.remove()
  }

  private build(): void {
    ensureUiStyles()
    const button = createElement('button', 'bp-header-btn bp-themed')
    button.type = 'button'
    button.setAttribute('aria-label', 'Better ChatGPT settings')
    button.appendChild(createIcon('sliders'))
    button.addEventListener('click', () => this.context.openSettings())
    this.tooltip = new Tooltip(button, (container) => container.append(createElement('div', 'bp-tip-mode', 'Better ChatGPT'), createElement('div', 'bp-tip-sub', 'Settings')), { align: 'end' })
    this.wrapper.replaceChildren(button)
  }
}
