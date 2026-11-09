import type { Field } from '../core/placeholders'
import { createElement } from '@nolly/core'
import { createButton } from './controls'
import { createDialog } from './dialog'

const DIALOG_ID = 'better-perplexity-fields-dialog'

export interface AskOptions {
  title: string
  description: string
  confirm?: string
}

export const askFields = (fields: readonly Field[], { title, description, confirm = 'Continue' }: AskOptions): Promise<Record<string, string> | null> => new Promise((resolve) => {
  document.getElementById(DIALOG_ID)?.remove()
  const ui = createDialog({ id: DIALOG_ID, title, description, width: 540 })
  const values: Record<string, string> = Object.fromEntries(fields.map((field) => [field.key, field.value ?? '']))
  let settled = false
  const finish = (result: Record<string, string> | null): void => {
    if (settled) return
    settled = true
    resolve(result)
  }
  const submit = (): void => {
    finish({ ...values })
    ui.close()
  }
  const stack = createElement('div', 'bp-stack')
  let first: HTMLElement | null = null
  for (const field of fields) {
    const wrapper = createElement('label', 'bp-stack')
    wrapper.appendChild(createElement('span', 'bp-data-label', field.label))
    const input = field.long ? createElement('textarea', 'bp-input') : createElement('input', 'bp-input')
    input.value = values[field.key] ?? ''
    input.placeholder = field.long ? 'Type or paste here…' : 'Type here…'
    if (input instanceof HTMLTextAreaElement) input.rows = 5
    input.addEventListener('input', () => (values[field.key] = input.value))
    input.addEventListener('keydown', (event: Event) => {
      const keyboardEvent = event as KeyboardEvent
      if (keyboardEvent.key === 'Enter' && (!field.long || keyboardEvent.ctrlKey || keyboardEvent.metaKey)) {
        keyboardEvent.preventDefault()
        submit()
      }
    })
    wrapper.appendChild(input)
    stack.appendChild(wrapper)
    first ??= input
  }
  ui.body.appendChild(stack)
  ui.dialog.addEventListener('close', () => finish(null))
  ui.footer.append(createButton('Cancel', { onClick: ui.close }), createButton(confirm, { primary: true, onClick: submit }))
  ui.show()
  first?.focus()
})