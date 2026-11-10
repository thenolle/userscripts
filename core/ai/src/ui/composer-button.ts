import { createElement } from '@nolly/core'
import { markUi, uiConfig } from './config'
import type { ComposerActions } from './config'
import { createIcon, type IconName } from './icons'
import { ensureUiStyles } from './styles'
import { Tooltip } from './tooltip'

export interface ComposerButtonOptions {
  id: string
  after?: readonly string[]
}

const CONFIG_BUTTON = '.bp-config-button'
const NO_ACTIONS: ComposerActions = { first: null, submit: null }

export class ComposerButton {
  readonly element = markUi(createElement('button'))
  private readonly tooltip: Tooltip
  private appliedClass = ''

  constructor(label: string, icon: IconName, hint: string, onClick: () => void, private readonly options: ComposerButtonOptions) {
    ensureUiStyles()
    this.element.type = 'button'
    this.element.setAttribute('aria-label', label)
    this.element.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer'
    this.element.appendChild(createIcon(icon))
    this.element.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      onClick()
    })
    this.tooltip = new Tooltip(this.element, (container) => container.append(createElement('div', 'bp-tip-mode', label), createElement('div', 'bp-tip-sub', hint)))
  }

  mount(): void {
    const { first, submit } = uiConfig().composerActions?.() ?? NO_ACTIONS
    const chained = (this.options.after ?? []).map((id) => document.querySelector<HTMLElement>(`.bp-cb-${id}`)).find(Boolean)
    const anchor = chained ?? document.querySelector<HTMLElement>(CONFIG_BUTTON) ?? first
    if (!anchor && !submit) {
      this.unmount()
      return
    }
    const className = `${first?.className ?? ''} bp-composer-button bp-cb-${this.options.id}`
    if (className !== this.appliedClass) {
      this.element.className = className
      this.appliedClass = className
    }
    if (anchor) {
      if (anchor.nextElementSibling !== this.element) anchor.insertAdjacentElement('afterend', this.element)
      return
    }
    if (submit && submit.previousElementSibling !== this.element) submit.insertAdjacentElement('beforebegin', this.element)
  }

  unmount(): void {
    this.tooltip.hide()
    this.element.remove()
  }
}
