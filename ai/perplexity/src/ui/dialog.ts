import { createElement } from '@nolly/core'
import { markUi } from '../core/dom'
import { ensureUiStyles } from './styles'

export interface DialogOptions {
  id: string
  title: string
  description?: string
  width?: number
}

export interface DialogHandle {
  readonly dialog: HTMLDialogElement
  readonly body: HTMLElement
  readonly footer: HTMLElement
  close: () => void
  show: () => void
}

export const createDialog = ({ id, title, description, width = 560 }: DialogOptions): DialogHandle => {
  ensureUiStyles()
  const dialog = markUi(createElement('dialog', 'bp-dialog bp-themed'))
  dialog.id = id
  dialog.style.setProperty('--bp-width', `${width}px`)
  const header = createElement('header', 'bp-dialog-header')
  const heading = createElement('div')
  heading.appendChild(createElement('h2', 'bp-dialog-title', title))
  if (description) heading.appendChild(createElement('p', 'bp-dialog-description', description))
  const closeButton = createElement('button', 'bp-icon-button', '×')
  closeButton.type = 'button'
  closeButton.setAttribute('aria-label', 'Close')
  header.append(heading, closeButton)
  const body = createElement('div', 'bp-dialog-body')
  const footer = createElement('footer', 'bp-dialog-footer')
  dialog.append(header, body, footer)
  const close = (): void => dialog.close()
  closeButton.addEventListener('click', close)
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close()
  })
  dialog.addEventListener('close', () => dialog.remove())
  const show = (): void => {
    document.body.appendChild(dialog)
    dialog.showModal()
  }
  return { dialog, body, footer, close, show }
}