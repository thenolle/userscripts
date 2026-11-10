import { createElement } from '@nolly/core'
import { markUi } from '../../core/dom'
import { estimateTokens, ensureUiStyles } from '@nolly/ai'
import type { Draft } from './store'
import { ensureDraftStyles } from './styles'

const WARN_RATIO = 0.7
const DANGER_RATIO = 0.9
const GAP = 8

const formatAge = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
}

export class DraftOverlay {
  private readonly meter = markUi(createElement('div', 'bp-draft-meter bp-themed'))
  private readonly meterText = createElement('span')
  private readonly splitButton = createElement('button', undefined, 'Split')
  private readonly banner = markUi(createElement('div', 'bp-draft-banner bp-themed'))
  private readonly bannerText = createElement('span')
  private readonly restoreButton = createElement('button', undefined, 'Restore')
  private readonly discardButton = createElement('button', undefined, 'Discard')

  constructor() {
    ensureUiStyles()
    ensureDraftStyles()
    this.splitButton.type = 'button'
    this.splitButton.hidden = true
    this.restoreButton.type = 'button'
    this.discardButton.type = 'button'
    this.meter.append(this.meterText, this.splitButton)
    this.banner.append(this.bannerText, this.restoreButton, this.discardButton)
  }

  onSplit(handler: () => void): void {
    this.splitButton.onclick = handler
  }

  showMeter(composer: HTMLElement, text: string, limit: number): void {
    const tokens = estimateTokens(text)
    const ratio = tokens / limit
    const maxChars = Math.round(limit * 4)
    this.meterText.textContent = `${text.length.toLocaleString()} / ~${maxChars.toLocaleString()} chars · ~${tokens.toLocaleString()} / ${limit.toLocaleString()} tokens`
    this.meter.dataset['level'] = ratio >= DANGER_RATIO ? 'danger' : ratio >= WARN_RATIO ? 'warn' : 'ok'
    this.splitButton.hidden = ratio < 1
    this.mount(this.meter)
    this.meter.dataset['visible'] = 'true'
    this.position(composer)
  }

  hideMeter(): void {
    this.meter.dataset['visible'] = 'false'
  }

  showBanner(composer: HTMLElement, draft: Draft, onRestore: () => void, onDiscard: () => void): void {
    this.bannerText.textContent = `Draft from ${formatAge(Date.now() - draft.at)}`
    this.restoreButton.onclick = onRestore
    this.discardButton.onclick = onDiscard
    this.mount(this.banner)
    this.banner.dataset['visible'] = 'true'
    this.position(composer)
  }

  hideBanner(): void {
    this.banner.dataset['visible'] = 'false'
  }

  position(composer: HTMLElement): void {
    const rect = composer.getBoundingClientRect()
    const top = Math.max(GAP, rect.top - this.meter.offsetHeight - GAP)
    this.meter.style.top = `${top}px`
    this.meter.style.left = `${Math.max(GAP, rect.right - this.meter.offsetWidth)}px`
    this.banner.style.top = `${top}px`
    this.banner.style.left = `${Math.max(GAP, rect.left)}px`
  }

  hideAll(): void {
    this.hideMeter()
    this.hideBanner()
  }

  private mount(element: HTMLElement): void {
    if (!element.isConnected) document.body.appendChild(element)
  }
}