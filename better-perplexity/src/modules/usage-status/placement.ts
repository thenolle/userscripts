import { injectStyle } from '@nolly/core'
import { findAvatar } from '../../locate'

export interface Placement {
  readonly anchor: Element
  readonly position: 'afterend' | 'beforebegin' | 'beforeend'
  readonly mode: 'avatar' | 'floating'
}

const FLOATING_CSS = `
.bp-usage-indicator[data-placement="floating"] {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 2147483000;
  padding: 2px 6px;
  color: CanvasText;
  background: color-mix(in srgb, Canvas 92%, transparent);
  border: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(6px);
}
`

export const resolvePlacement = (): Placement => {
  const avatar = findAvatar()
  if (avatar?.isConnected) return { anchor: avatar, position: 'afterend', mode: 'avatar' }
  injectStyle('better-perplexity-usage-floating', FLOATING_CSS)
  return { anchor: document.body, position: 'beforeend', mode: 'floating' }
}

export const isPlaced = (element: Element, { anchor, position }: Placement): boolean => {
  if (position === 'afterend') return anchor.nextElementSibling === element
  if (position === 'beforebegin') return anchor.previousElementSibling === element
  return element.parentElement === anchor
}
