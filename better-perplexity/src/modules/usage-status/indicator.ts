import { createElement } from '@nolly/core'
import { markUi } from '../../core/dom'
import { Tooltip } from '../../ui/tooltip'
import { ensureUiStyles } from '../../ui/styles'
import { isPlaced, type Placement } from './placement'
import type { UsageService } from './service'
import { renderUsageTooltip } from './tooltip-content'
import { ensureUsageStyles } from './styles'

export class UsageIndicator {
  readonly element = markUi(createElement('div', 'bp-usage-indicator bp-themed'))
  private readonly label = createElement('span', 'bp-usage-label', 'Usage')
  private readonly tooltip: Tooltip

  constructor(private readonly service: UsageService, onOpen: () => void) {
    ensureUiStyles()
    ensureUsageStyles()
    this.element.dataset['status'] = 'unavailable'
    const trigger = createElement('button', 'bp-usage-trigger')
    trigger.type = 'button'
    trigger.setAttribute('aria-label', 'View Perplexity usage limits')
    trigger.append(createElement('span', 'bp-usage-dot'), this.label)
    trigger.addEventListener('click', onOpen)
    this.element.appendChild(trigger)
    this.tooltip = new Tooltip(trigger, (container) => renderUsageTooltip(container, service), { align: 'start' })
  }

  mount(placement: Placement): void {
    if (this.element.dataset['placement'] !== placement.mode) this.element.dataset['placement'] = placement.mode
    if (isPlaced(this.element, placement)) return
    placement.anchor.insertAdjacentElement(placement.position, this.element)
    this.render()
  }

  render(): void {
    const active = this.service.getActive()
    if (!active) {
      this.element.dataset['status'] = 'unavailable'
      this.label.textContent = this.service.fetching ? 'Loading' : 'Usage unavailable'
    } else {
      this.element.dataset['status'] = active.status
      this.label.textContent = active.freeFallback ? 'Free queries' : active.remaining === null ? active.label : `${active.remaining} left`
    }
    this.tooltip.refresh()
  }

  destroy(): void {
    this.tooltip.destroy()
    this.element.remove()
  }
}