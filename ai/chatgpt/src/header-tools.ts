import { createElement } from '@nolly/core'
import { markUi } from './dom'
import { findHeaderSlot } from './locate'

const container = markUi(createElement('div', 'pointer-events-auto flex items-center gap-1 no-drag shrink-0'))

export const headerTools = (): HTMLElement | null => {
  const slot = findHeaderSlot()
  if (!slot) return null
  if (container.parentElement !== slot || slot.firstElementChild !== container) slot.prepend(container)
  return container
}
