import { copyText } from '../../core/clipboard'
import { createElement } from '../../core/dom'
import { createButton, createTextArea } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import type { Prompt, PromptStore } from './store'
import { ensureSlashStyles } from './styles'

const DIALOG_ID = 'better-perplexity-prompts-dialog'

export const toggleManager = (store: PromptStore, onInsert: (prompt: Prompt) => void): void => {
  const existing = document.getElementById(DIALOG_ID)
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  ensureSlashStyles()
  const ui = createDialog({ id: DIALOG_ID, title: 'Prompt library', description: 'Type / in an empty message box to insert a prompt.', width: 620 })
  const status = createElement('span', 'bp-updated')
  const editForm = (prompt: Prompt): void => {
    const draft = { ...prompt }
    const title = createElement('input', 'bp-input')
    title.placeholder = 'Title'
    title.value = draft.title
    title.addEventListener('input', () => (draft.title = title.value))
    const body = createTextArea('Prompt text. Variables: {{clipboard}} {{selection}} {{date}} {{url}} {{ask:Label}}', draft.body, (value) => (draft.body = value))
    body.rows = 12
    const stack = createElement('div', 'bp-stack')
    stack.append(title, body)
    ui.body.replaceChildren(stack)
    ui.footer.replaceChildren(
      createButton('Cancel', { onClick: list }),
      createButton('Save', {
        primary: true,
        onClick: () => {
          if (draft.title.trim() && draft.body.trim()) store.upsert({ ...draft, title: draft.title.trim() })
          list()
        }
      })
    )
  }
  const list = (): void => {
    const prompts = store.list()
    const rows = prompts.map((prompt) => {
      const row = createElement('div', 'bp-prompt-row')
      const main = createElement('div', 'bp-prompt-main')
      main.append(createElement('div', undefined, prompt.title), createElement('div', 'bp-data-label', prompt.body.replace(/\s+/g, ' ').slice(0, 70)))
      const actions = createElement('div', 'bp-prompt-actions')
      actions.append(
        createButton('Insert', {
          onClick: () => {
            ui.close()
            window.setTimeout(() => onInsert(prompt), 0)
          }
        }),
        createButton('Edit', { onClick: () => editForm(prompt) }),
        createButton('Delete', {
          onClick: () => {
            store.remove(prompt.id)
            list()
          }
        })
      )
      row.append(main, actions)
      return row
    })
    const stack = createElement('div', 'bp-stack')
    stack.append(...(rows.length ? rows : [createElement('div', 'bp-empty', 'No prompts yet.')]))
    ui.body.replaceChildren(stack)
    ui.footer.replaceChildren(
      status,
      createButton('Export', { onClick: () => void copyText(store.exportJson()).then((ok) => (status.textContent = ok ? 'Copied JSON to the clipboard.' : 'Copy failed.')) }),
      createButton('Import', {
        onClick: () => {
          const text = window.prompt('Paste prompts JSON', '')
          if (!text) return
          try {
            status.textContent = `Imported ${store.importJson(text)} prompts.`
            list()
          } catch (error) {
            status.textContent = error instanceof Error ? error.message : 'Import failed.'
          }
        }
      }),
      createButton('New prompt', { primary: true, onClick: () => editForm(store.create()) })
    )
  }
  list()
  ui.show()
}