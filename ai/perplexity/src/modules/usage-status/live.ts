import { formatAgo } from './format'
import type { UsageService } from './service'
import type { LimitKey } from './types'

export const updateLive = (service: UsageService): void => {
  for (const element of document.querySelectorAll<HTMLElement>('[data-bp-timer]')) {
    const text = service.formatForecast(element.dataset['bpTimer'] as LimitKey)
    if (element.textContent !== text) element.textContent = text
  }
  for (const element of document.querySelectorAll<HTMLElement>('[data-bp-progress]')) {
    const progress = service.getForecast(element.dataset['bpProgress'] as LimitKey)?.progress ?? 0
    element.style.width = `${(progress * 100).toFixed(1)}%`
  }
  for (const element of document.querySelectorAll<HTMLElement>('[data-bp-updated]')) {
    const text = service.lastFetchedAt ? `Updated ${formatAgo(Date.now() - service.lastFetchedAt)}` : 'Waiting for usage data'
    if (element.textContent !== text) element.textContent = text
  }
}