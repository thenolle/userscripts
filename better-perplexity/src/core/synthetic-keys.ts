const SEND_SELECTOR = 'button[type="submit"], button[aria-label*="submit" i], button[aria-label*="send" i]'
const MAX_SEARCH_DEPTH = 8

const synthetic = new WeakSet<Event>()

export const isSynthetic = (event: Event): boolean => synthetic.has(event)

export const dispatchEnter = (target: HTMLElement, shiftKey: boolean): boolean => {
  const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, shiftKey, bubbles: true, cancelable: true, composed: true })
  synthetic.add(event)
  return target.dispatchEvent(event)
}

export const findSendButton = (from: HTMLElement): HTMLButtonElement | null => {
  let scope: HTMLElement | null = from
  for (let depth = 0; scope && depth < MAX_SEARCH_DEPTH; depth++) {
    const button = scope.querySelector<HTMLButtonElement>(SEND_SELECTOR)
    if (button && !button.disabled) return button
    scope = scope.parentElement
  }
  return null
}