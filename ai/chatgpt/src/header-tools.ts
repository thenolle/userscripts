import { createElement } from '@nolly/core'
import { markUi } from './dom'
import { TOOLS_CLASS } from './header-style'
import { findHeaderSlot } from './locate'

const container = markUi(createElement('div', TOOLS_CLASS))

export const headerTools = (): HTMLElement | null => {
  const slot = findHeaderSlot()
  if (!slot) return null
  if (container.parentElement !== slot || slot.firstElementChild !== container) slot.prepend(container)
  return container
}
