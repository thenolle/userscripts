import { sleep, toElement } from '@nolly/core'
import type { ComposerAdapter } from './adapter'
import { dispatchEnter, findGenericSendButton } from './keys'

export const EDITABLE_SELECTOR = [
  'textarea',
  'input:not([type])',
  'input[type="text"]',
  'input[type="search"]',
  'input[type="email"]',
  'input[type="url"]',
  'input[type="tel"]',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  '[role="textbox"]'
].join(', ')

type TextInput = HTMLInputElement | HTMLTextAreaElement

const isVisible = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
}

const normalize = (text: string): string => text.replace(/\s+/g, ' ').trim()

const isTextInput = (element: HTMLElement): element is TextInput => element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement

export const readComposer = (editable: HTMLElement): string => {
  if (isTextInput(editable)) return editable.value
  return editable.innerText ?? editable.textContent ?? ''
}

export const isComposerEmpty = (editable: HTMLElement): boolean => !editable.isConnected || readComposer(editable).trim() === ''

export const isSendButton = (button: HTMLButtonElement): boolean => {
  const label = [button.getAttribute('aria-label') ?? '', button.title, button.textContent ?? ''].join(' ').toLowerCase()
  return button.type === 'submit' || /\b(send|submit|ask)\b/.test(label)
}

const matches = (editable: HTMLElement, text: string): boolean => normalize(readComposer(editable)) === normalize(text)

const dispatchInput = (editable: HTMLElement, inputType: string, data: string | null): void => {
  editable.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType, data }))
}

const dispatchPaste = (editable: HTMLElement, text: string): boolean => {
  const transfer = new DataTransfer()
  transfer.setData('text/plain', text)
  const event = new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true, composed: true })
  editable.dispatchEvent(event)
  return event.defaultPrevented
}

const getNativeValueSetter = (editable: TextInput): ((value: string) => void) | null => {
  const prototype = editable instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  return setter ? (value) => setter.call(editable, value) : null
}

const writeTextInput = (editable: TextInput, text: string): boolean => {
  editable.focus()
  const setter = getNativeValueSetter(editable)
  if (setter) setter(text)
  else editable.value = text
  try { editable.setSelectionRange(text.length, text.length) } catch {}
  dispatchInput(editable, text ? 'insertText' : 'deleteContent', text || null)
  return editable.value === text
}

const selectAll = (editable: HTMLElement): Range => {
  const range = document.createRange()
  range.selectNodeContents(editable)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  return range
}

const writeContentEditable = (editable: HTMLElement, text: string): boolean => {
  const selection = window.getSelection()
  if (!selection) return false
  const range = selectAll(editable)
  range.deleteContents()
  if (text) {
    const textNode = document.createTextNode(text)
    range.insertNode(textNode)
    range.setStartAfter(textNode)
  } else {
    range.selectNodeContents(editable)
  }
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  dispatchInput(editable, text ? 'insertText' : 'deleteContent', text || null)
  return matches(editable, text)
}

const waitForComposer = async (editable: HTMLElement, text: string, timeout = 300): Promise<boolean> => {
  const interval = 30
  const attempts = Math.ceil(timeout / interval)
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (!editable.isConnected) return false
    if (matches(editable, text)) return true
    await sleep(interval)
  }
  return matches(editable, text)
}

export interface ComposerKit {
  editableFrom(target: EventTarget | null): HTMLElement | null
  findComposer(): HTMLElement | null
  findSend(editable: HTMLElement): HTMLElement | null
  writeComposer(editable: HTMLElement, text: string): Promise<boolean>
  sendComposer(editable: HTMLElement): Promise<boolean>
  attachFile(editable: HTMLElement, file: File): boolean
}

export const createComposerKit = (adapter: ComposerAdapter): ComposerKit => {
  const { isOwnUi } = adapter
  const rejected = (element: HTMLElement): boolean => adapter.rejectEditable?.(element) ?? false
  const usable = (element: HTMLElement): boolean => !isOwnUi(element) && !rejected(element) && isVisible(element)

  const editableFrom = (target: EventTarget | null): HTMLElement | null => {
    const element = toElement(target)?.closest<HTMLElement>(EDITABLE_SELECTOR) ?? null
    return element && !rejected(element) ? element : null
  }

  const findComposer = (): HTMLElement | null => {
    const located = adapter.locateComposer?.()
    if (located && usable(located)) return located
    const active = document.activeElement
    if (active instanceof HTMLElement && active.matches(EDITABLE_SELECTOR) && usable(active)) return active
    const candidates = [...document.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR)].filter(
      (element) => usable(element) && !element.hasAttribute('disabled') && !element.hasAttribute('readonly')
    )
    return candidates.at(-1) ?? null
  }

  const findSend = (editable: HTMLElement): HTMLElement | null => (adapter.findSendButton ? adapter.findSendButton(editable) : findGenericSendButton(editable))

  const writeComposer = async (editable: HTMLElement, text: string): Promise<boolean> => {
    if (!editable.isConnected) return false
    if (editable.hasAttribute('disabled') || editable.hasAttribute('readonly') || editable.getAttribute('aria-disabled') === 'true') return false
    editable.focus()
    if (isTextInput(editable)) {
      writeTextInput(editable, text)
      return waitForComposer(editable, text)
    }
    if (!editable.isContentEditable && editable.getAttribute('role') !== 'textbox') return false
    if (text) {
      dispatchPaste(editable, text)
      if (await waitForComposer(editable, text, 150)) return true
    }
    if (!writeContentEditable(editable, text)) return false
    return waitForComposer(editable, text)
  }

  const awaitSend = async (editable: HTMLElement): Promise<HTMLElement | null> => {
    for (let attempt = 0; attempt < 12; attempt++) {
      const button = findSend(editable)
      if (button) return button
      await sleep(100)
    }
    return null
  }

  const sendComposer = async (editable: HTMLElement): Promise<boolean> => {
    if (!editable.isConnected) return false
    if (adapter.sendWith !== 'button') {
      const handled = !dispatchEnter(editable, false)
      await sleep(handled ? 500 : 150)
      if (isComposerEmpty(editable)) return true
    }
    const button = adapter.sendWith === 'button' ? await awaitSend(editable) : findSend(editable)
    button?.click()
    await sleep(500)
    return isComposerEmpty(editable)
  }

  const attachFile = (editable: HTMLElement, file: File): boolean => {
    const transfer = new DataTransfer()
    transfer.items.add(file)
    const input = adapter.findFileInput?.() ?? [...document.querySelectorAll<HTMLInputElement>('input[type="file"]')].find((candidate) => !isOwnUi(candidate) && !candidate.disabled)
    if (input) {
      input.files = transfer.files
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
      return input.files?.length === 1
    }
    const event = new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true, composed: true })
    editable.dispatchEvent(event)
    return event.defaultPrevented
  }

  return { editableFrom, findComposer, findSend, writeComposer, sendComposer, attachFile }
}
