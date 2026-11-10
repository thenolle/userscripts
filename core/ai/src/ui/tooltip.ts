import { createElement } from '@nolly/core'
import { markUi } from './config'
import { ensureUiStyles } from './styles'

export type TooltipRenderer = (container: HTMLElement) => void

export interface TooltipOptions {
  align?: 'start' | 'end'
  showDelay?: number
  hideDelay?: number
}

const MARGIN = 8
const GAP = 10
let counter = 0

export class Tooltip {
  private readonly element = markUi(createElement('div', 'bp-tooltip bp-themed'))
  private showTimer = 0
  private hideTimer = 0
  private liveTimer = 0
  private visible = false

  constructor(
    private readonly anchor: HTMLElement,
    private readonly renderer: TooltipRenderer,
    private readonly options: TooltipOptions = {}
  ) {
    ensureUiStyles()
    this.element.id = `bp-tooltip-${++counter}`
    this.element.setAttribute('role', 'tooltip')
    this.element.popover = 'manual'
    anchor.setAttribute('aria-describedby', this.element.id)
    anchor.addEventListener('pointerenter', this.handleEnter)
    anchor.addEventListener('pointerleave', this.handleLeave)
    anchor.addEventListener('focus', this.handleFocus)
    anchor.addEventListener('blur', this.handleLeave)
    anchor.addEventListener('keydown', this.handleKeydown)
    anchor.addEventListener('click', this.handleLeave)
  }

  show(): void {
    window.clearTimeout(this.hideTimer)
    if (!this.anchor.isConnected) return
    this.renderContent()
    if (!this.element.isConnected) document.body.appendChild(this.element)
    if (!this.visible) {
      this.element.showPopover()
      this.visible = true
      this.liveTimer = window.setInterval(() => this.refresh(), 1_000)
    }
    this.position()
  }

  hide(): void {
    window.clearTimeout(this.showTimer)
    if (!this.visible) return
    this.visible = false
    window.clearInterval(this.liveTimer)
    if (this.element.matches(':popover-open')) this.element.hidePopover()
  }

  destroy(): void {
    this.hide()
    this.anchor.removeEventListener('pointerenter', this.handleEnter)
    this.anchor.removeEventListener('pointerleave', this.handleLeave)
    this.anchor.removeEventListener('focus', this.handleFocus)
    this.anchor.removeEventListener('blur', this.handleLeave)
    this.anchor.removeEventListener('keydown', this.handleKeydown)
    this.anchor.removeEventListener('click', this.handleLeave)
    this.element.remove()
  }

  refresh(): void {
    if (!this.visible) return
    if (!this.anchor.isConnected) {
      this.hide()
      return
    }
    this.renderContent()
    this.position()
  }

  private readonly handleEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return
    window.clearTimeout(this.hideTimer)
    window.clearTimeout(this.showTimer)
    this.showTimer = window.setTimeout(() => this.show(), this.options.showDelay ?? 120)
  }

  private readonly handleLeave = (): void => {
    window.clearTimeout(this.showTimer)
    window.clearTimeout(this.hideTimer)
    this.hideTimer = window.setTimeout(() => this.hide(), this.options.hideDelay ?? 80)
  }

  private readonly handleFocus = (): void => {
    if (this.anchor.matches(':focus-visible')) this.show()
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.hide()
  }

  private renderContent(): void {
    const body = createElement('div', 'bp-tooltip-body')
    this.renderer(body)
    this.element.replaceChildren(body)
  }

  private position(): void {
    const anchorRect = this.anchor.getBoundingClientRect()
    const rect = this.element.getBoundingClientRect()
    const preferred = this.options.align === 'end' ? anchorRect.right - rect.width : anchorRect.left
    const left = Math.min(Math.max(preferred, MARGIN), Math.max(MARGIN, window.innerWidth - rect.width - MARGIN))
    const below = anchorRect.bottom + GAP
    const above = anchorRect.top - GAP - rect.height
    const top = below + rect.height > window.innerHeight - MARGIN && above >= MARGIN ? above : below
    this.element.style.left = `${Math.round(left)}px`
    this.element.style.top = `${Math.round(top)}px`
  }
}
