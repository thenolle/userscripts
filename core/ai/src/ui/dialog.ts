import { createElement } from '@nolly/core'
import { markUi } from './config'
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

  const positioning: Readonly<Record<string, string>> = {
    position: 'fixed',
    inset: '0',
    margin: 'auto',
    width: `min(${width}px, calc(100vw - 32px))`,
    height: 'fit-content',
    'min-width': '0',
    'min-height': '0',
    'max-width': 'calc(100vw - 32px)',
    'max-height': 'min(86dvh, 820px)',
    'box-sizing': 'border-box',
    transform: 'none',
    translate: 'none',
    animation: 'none'
  }

  for (const [property, value] of Object.entries(positioning)) {
    dialog.style.setProperty(property, value, 'important')
  }

  const header = createElement('header', 'bp-dialog-header')
  const heading = createElement('div')
  const titleElement = createElement('h2', 'bp-dialog-title', title)
  titleElement.id = `${id}-title`
  dialog.setAttribute('aria-labelledby', titleElement.id)
  heading.appendChild(titleElement)

  if (description) {
    const descriptionElement = createElement('p', 'bp-dialog-description', description)
    descriptionElement.id = `${id}-description`
    dialog.setAttribute('aria-describedby', descriptionElement.id)
    heading.appendChild(descriptionElement)
  }

  const closeButton = createElement('button', 'bp-icon-button', '×')
  closeButton.type = 'button'
  closeButton.setAttribute('aria-label', 'Close')

  header.append(heading, closeButton)

  const body = createElement('div', 'bp-dialog-body')
  const footer = createElement('footer', 'bp-dialog-footer')
  dialog.append(header, body, footer)

  const close = (): void => {
    if (dialog.open) dialog.close()
    else dialog.remove()
  }

  closeButton.addEventListener('click', close)

  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return
    const rect = dialog.getBoundingClientRect()
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
    if (outside) close()
  })

  dialog.addEventListener('close', () => dialog.remove())

  const show = (): void => {
    if (!dialog.isConnected) document.body.appendChild(dialog)
    if (dialog.open) return
    dialog.style.setProperty('display', 'flex', 'important')
    dialog.style.setProperty('flex-direction', 'column', 'important')
    dialog.showModal()
  }

  return { dialog, body, footer, close, show }
}
