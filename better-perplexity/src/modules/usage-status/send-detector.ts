import { toElement } from '../../core/dom'

const SEND_HINTS = ['send', 'submit', 'search']
const EDITABLE_SELECTOR = 'textarea, [contenteditable="true"], [contenteditable="plaintext-only"]'

export class SendDetector {
  private attached = false

  constructor(private readonly onSend: () => void) {}

  attach(): void {
    if (this.attached) return
    document.addEventListener('submit', this.handleSubmit, true)
    document.addEventListener('click', this.handleClick, true)
    document.addEventListener('keydown', this.handleKeydown, true)
    this.attached = true
  }

  detach(): void {
    if (!this.attached) return
    document.removeEventListener('submit', this.handleSubmit, true)
    document.removeEventListener('click', this.handleClick, true)
    document.removeEventListener('keydown', this.handleKeydown, true)
    this.attached = false
  }

  private readonly handleSubmit = (): void => this.onSend()

  private readonly handleClick = (event: MouseEvent): void => {
    const button = toElement(event.target)?.closest('button')
    if (!button) return
    const label = (button.getAttribute('aria-label') ?? '').toLowerCase()
    const text = (button.textContent ?? '').toLowerCase()
    if (button.type === 'submit' || SEND_HINTS.some((hint) => label.includes(hint)) || text.includes('send')) this.onSend()
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' || event.isComposing || event.shiftKey) return
    if (toElement(event.target)?.closest(EDITABLE_SELECTOR)) this.onSend()
  }
}