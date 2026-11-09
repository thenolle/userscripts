import { createElement } from '@nolly/core'
import type { UsageService } from './service'
import type { LimitKey, Status } from './types'

export const createStatusBar = (remaining: number, total: number, status: Status): HTMLElement => {
  const bar = createElement('div', 'bp-progress')
  const fill = createElement('div', `bp-progress-fill ${status}`)
  fill.style.width = `${Math.max(0, Math.min(100, (remaining / total) * 100))}%`
  bar.appendChild(fill)
  return bar
}

export const createTimerBlock = (service: UsageService, key: LimitKey): HTMLElement => {
  const block = createElement('div', 'bp-timer-block')
  const bar = createElement('div', 'bp-progress')
  const fill = createElement('div', 'bp-progress-fill timer')
  fill.dataset['bpProgress'] = key
  bar.appendChild(fill)
  const text = createElement('div', 'bp-timer-text', service.formatForecast(key))
  text.dataset['bpTimer'] = key
  block.append(bar, text)
  return block
}