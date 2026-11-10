import { dispatchEnter, findSendButton } from '@nolly/ai'
import { toElement } from '@nolly/core'

const EDITABLE_SELECTOR = 'textarea, [contenteditable="true"], [contenteditable="plaintext-only"]'

export const getEditableTarget = (event: Event): HTMLElement | null => {
  const origin = event.composedPath()[0] ?? event.target
  const editable = toElement(origin)?.closest<HTMLElement>(EDITABLE_SELECTOR)
  if (!editable?.isConnected) return null
  return editable instanceof HTMLTextAreaElement || editable.isContentEditable ? editable : null
}

export const isComposing = (event: KeyboardEvent): boolean => event.isComposing || event.keyCode === 229

const insertNewlineManually = (editable: HTMLElement): void => {
  if (editable instanceof HTMLTextAreaElement) {
    editable.setRangeText('\n', editable.selectionStart, editable.selectionEnd, 'end')
    editable.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertLineBreak', data: '\n' }))
    return
  }
  const selection = window.getSelection()
  if (!selection) return
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange()
  if (!editable.contains(range.commonAncestorContainer)) {
    range.selectNodeContents(editable)
    range.collapse(false)
  }
  range.deleteContents()
  const lineBreak = document.createElement('br')
  range.insertNode(lineBreak)
  range.setStartAfter(lineBreak)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  editable.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertLineBreak', data: null }))
}

export const insertNewline = (editable: HTMLElement): void => {
  if (dispatchEnter(editable, true)) insertNewlineManually(editable)
}

export const sendMessage = (editable: HTMLElement): void => {
  if (dispatchEnter(editable, false)) findSendButton(editable)?.click()
}
