import { createElement } from '@nolly/core'
import { markUi } from '../../core/dom'
import { createButton, ensureUiStyles } from '@nolly/ai'
import { formatShortcut, matchesShortcut, type Shortcut } from '../command-palette/shortcut'
import { ensureTourStyles } from './styles'

export interface Step {
  title: string
  body: string
  target?: () => HTMLElement | null
  kind?: 'info' | 'click' | 'key' | 'wait'
  shortcut?: () => Shortcut
  until?: () => boolean
  hint?: string
  before?: () => void | Promise<void>
}

const PADDING = 6
const ADVANCE_DELAY = 350

export class TourRunner {
  private readonly layer = markUi(createElement('div', 'bp-tour bp-themed'))
  private readonly hole = createElement('div', 'bp-tour-hole')
  private readonly card = createElement('div', 'bp-tour-card')
  private steps: readonly Step[] = []
  private index = 0
  private frame = 0
  private advancing = 0
  private scrolledFor = -1
  private onExit: () => void = () => undefined

  constructor() {
    ensureUiStyles()
    ensureTourStyles()
    this.layer.append(this.hole, this.card)
  }

  get active(): boolean {
    return this.layer.isConnected
  }

  start(steps: readonly Step[], onExit: () => void = () => undefined): void {
    this.stop()
    this.steps = steps
    this.onExit = onExit
    document.body.appendChild(this.layer)
    document.addEventListener('click', this.handleClick, true)
    window.addEventListener('keydown', this.handleKeydown, true)
    void this.show(0)
    this.frame = requestAnimationFrame(this.tick)
  }

  stop(): void {
    cancelAnimationFrame(this.frame)
    window.clearTimeout(this.advancing)
    document.removeEventListener('click', this.handleClick, true)
    window.removeEventListener('keydown', this.handleKeydown, true)
    this.layer.remove()
  }

  private get step(): Step | undefined {
    return this.steps[this.index]
  }

  private async show(index: number): Promise<void> {
    window.clearTimeout(this.advancing)
    this.index = index
    await this.step?.before?.()
    this.scrolledFor = -1
    this.renderCard()
  }

  private go(delta: number): void {
    const next = this.index + delta
    if (next < 0) return
    if (next >= this.steps.length) {
      this.finish()
      return
    }
    void this.show(next)
  }

  private finish(): void {
    this.stop()
    this.onExit()
  }

  private queue(): void {
    window.clearTimeout(this.advancing)
    this.advancing = window.setTimeout(() => this.go(1), ADVANCE_DELAY)
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const step = this.step
    const target = step?.target?.()
    if (step?.kind === 'click' && target && event.target instanceof Node && target.contains(event.target)) this.queue()
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    const step = this.step
    if (step?.kind === 'key' && step.shortcut && matchesShortcut(event, step.shortcut())) this.queue()
  }

  private hintFor(step: Step): string {
    if (step.hint) return step.hint
    if (step.kind === 'click') return 'Click the highlighted element to continue.'
    if (step.kind === 'key' && step.shortcut) return `Press ${formatShortcut(step.shortcut())} to continue.`
    if (step.kind === 'wait') return 'Waiting for you to do this…'
    return ''
  }

  private renderCard(): void {
    const step = this.step
    if (!step) return
    const interactive = step.kind === 'click' || step.kind === 'key' || step.kind === 'wait'
    const last = this.index === this.steps.length - 1
    const buttons = createElement('div', 'bp-tour-actions')
    if (this.index > 0) buttons.appendChild(createButton('Back', { onClick: () => this.go(-1) }))
    buttons.append(
      createButton('Exit', { onClick: () => this.finish() }),
      createButton(last ? 'Finish' : interactive ? 'Skip step' : 'Next', { primary: !interactive, onClick: () => this.go(1) })
    )
    const hint = this.hintFor(step)
    this.card.replaceChildren(
      createElement('div', 'bp-tour-count', `Step ${this.index + 1} of ${this.steps.length}`),
      createElement('div', 'bp-tour-title', step.title),
      createElement('div', 'bp-tour-body', step.body),
      ...(hint ? [createElement('div', 'bp-tour-hint', hint)] : []),
      buttons
    )
  }

  private readonly tick = (): void => {
    this.frame = requestAnimationFrame(this.tick)
    const dialog = [...document.querySelectorAll('dialog[open]')].at(-1)
    const host = dialog ?? document.body
    if (this.layer.parentElement !== host) host.appendChild(this.layer)
    const step = this.step
    if (!step) return
    if (step.kind === 'wait' && step.until?.() && !this.advancing) this.queue()
    const target = step.target?.() ?? null
    if (target && this.scrolledFor !== this.index) {
      this.scrolledFor = this.index
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    this.place(target, step)
  }

  private place(target: HTMLElement | null, step: Step): void {
    const margin = 12
    const cardWidth = this.card.offsetWidth
    const cardHeight = this.card.offsetHeight
    this.hole.dataset['pulse'] = String(step.kind === 'click')
    if (!target) {
      Object.assign(this.hole.style, { left: '50%', top: '50%', width: '0px', height: '0px' })
      this.card.style.left = `${Math.max(margin, (window.innerWidth - cardWidth) / 2)}px`
      this.card.style.top = `${Math.max(margin, (window.innerHeight - cardHeight) / 2)}px`
      return
    }
    const rect = target.getBoundingClientRect()
    Object.assign(this.hole.style, {
      left: `${rect.left - PADDING}px`,
      top: `${rect.top - PADDING}px`,
      width: `${rect.width + PADDING * 2}px`,
      height: `${rect.height + PADDING * 2}px`
    })
    const below = rect.bottom + PADDING + margin
    const fitsBelow = below + cardHeight < window.innerHeight - margin
    const top = fitsBelow ? below : Math.max(margin, rect.top - PADDING - margin - cardHeight)
    const left = Math.min(Math.max(margin, rect.left + rect.width / 2 - cardWidth / 2), window.innerWidth - cardWidth - margin)
    this.card.style.left = `${left}px`
    this.card.style.top = `${top}px`
  }
}