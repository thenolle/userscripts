import { getElement } from '@nolly/core'
import { HEADER } from '../../selectors'

export interface Placement {
  readonly anchor: Element
  readonly position: 'afterend' | 'beforebegin'
  readonly mode: 'avatar' | 'fallback'
}

export const resolvePlacement = (): Placement | null => {
  const avatar = getElement(HEADER.avatar)
  if (avatar?.isConnected) return { anchor: avatar, position: 'afterend', mode: 'avatar' }
  const next = getElement(HEADER.next)
  if (next) return { anchor: next, position: 'beforebegin', mode: 'fallback' }
  const previous = getElement(HEADER.previous)
  if (previous) return { anchor: previous, position: 'afterend', mode: 'fallback' }
  return null
}

export const isPlaced = (element: Element, { anchor, position }: Placement): boolean => {
  return position === 'afterend' ? anchor.nextElementSibling === element : anchor.previousElementSibling === element
}