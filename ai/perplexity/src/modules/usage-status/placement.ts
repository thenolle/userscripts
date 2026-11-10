import { findAvatar, findHeaderSlot } from '../../locate'

export interface Placement {
  readonly anchor: Element
  readonly position: 'afterend' | 'beforebegin' | 'beforeend'
  readonly mode: 'avatar' | 'header' | 'dock'
}

export const resolvePlacement = (): Placement => {
  const avatar = findAvatar()
  if (avatar?.isConnected) return { anchor: avatar, position: 'afterend', mode: 'avatar' }
  const slot = findHeaderSlot()
  if (slot?.isConnected) return { anchor: slot, position: 'beforebegin', mode: 'header' }
  return { anchor: document.body, position: 'beforeend', mode: 'dock' }
}

export const isPlaced = (element: Element, { anchor, position }: Placement): boolean => {
  if (position === 'afterend') return anchor.nextElementSibling === element
  if (position === 'beforebegin') return anchor.previousElementSibling === element
  return element.parentElement === anchor
}
