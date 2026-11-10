import { createElement } from '@nolly/core'
import { copyText, createDialog, showToast } from '@nolly/ai'
import { ensurePaletteStyles } from '../command-palette/styles'
import { threadLabel, timeAgo } from './format'
import type { HistoryEntry, HistoryFilter, HistoryStore } from './store'
import { ensureRecallStyles } from './styles'

const DIALOG_ID = 'better-perplexity-recall'
const LIMIT = 100

const FILTERS: readonly { readonly id: HistoryFilter; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'today', label: 'Today' },
  { id: 'here', label: 'This thread' }
]

export interface RecallActions {
  readonly store: HistoryStore
  readonly insert: (text: string) => void
  readonly send: (text: string) => void
  readonly queue: ((text: string) => void) | null
}

const metaLine = (entry: HistoryEntry, now: number): string => {
  const parts = [`${entry.pinned ? '★ ' : ''}${timeAgo(entry.last, now)}`]
  if (entry.count > 1) parts.push(`×${entry.count}`)
  const thread = entry.threads[0]
  if (thread) parts.push(threadLabel(thread.path))
  return parts.join(' · ')
}

export const toggleRecall = ({ store, insert, send, queue }: RecallActions): void => {
  const existing = document.getElementById(DIALOG_ID)
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  ensurePaletteStyles()
  ensureRecallStyles()
  const ui = createDialog({ id: DIALOG_ID, title: 'Recall', width: 680 })
  ui.dialog.classList.add('bp-palette', 'bp-recall')
  const input = createElement('input', 'bp-palette-input')
  input.placeholder = 'Search the messages you sent…'
  input.setAttribute('aria-label', 'Search your message history')
  const chips = createElement('div', 'bp-recall-chips')
  const list = createElement('div', 'bp-palette-list')
  list.setAttribute('role', 'listbox')
  const hint = createElement('div', 'bp-recall-hint', `Enter insert · Shift+Enter send${queue ? ' · Ctrl+Enter queue' : ''} · Alt+P pin · Alt+Delete remove`)
  ui.body.append(input, chips, list, hint)

  let filter: HistoryFilter = 'all'
  let selected = 0
  let rows: HistoryEntry[] = []

  const finish = (action: () => void): void => {
    ui.close()
    window.setTimeout(action, 0)
  }

  const button = (label: string, handler: () => void): HTMLButtonElement => {
    const element = createElement('button', 'bp-recall-action', label)
    element.type = 'button'
    element.addEventListener('click', (event) => {
      event.stopPropagation()
      handler()
    })
    return element
  }

  const renderChips = (): void => {
    chips.replaceChildren(
      ...FILTERS.map(({ id, label }) => {
        const chip = createElement('button', 'bp-recall-chip', label)
        chip.type = 'button'
        chip.setAttribute('aria-pressed', String(id === filter))
        chip.addEventListener('click', () => {
          filter = id
          selected = 0
          render()
          input.focus()
        })
        return chip
      })
    )
  }

  const render = (): void => {
    const now = Date.now()
    rows = store.search(input.value, filter, { path: location.pathname, now }).slice(0, LIMIT)
    selected = Math.max(0, Math.min(selected, rows.length - 1))
    renderChips()
    if (!rows.length) {
      list.replaceChildren(createElement('div', 'bp-palette-empty', store.size === 0 ? 'Nothing here yet. Messages you send will appear here.' : 'No matching messages.'))
      return
    }
    list.replaceChildren(
      ...rows.map((entry, index) => {
        const item = createElement('div', 'bp-palette-item bp-recall-row')
        item.setAttribute('role', 'option')
        item.setAttribute('aria-selected', String(index === selected))
        const main = createElement('div', 'bp-recall-main')
        main.append(createElement('div', 'bp-recall-text', entry.text), createElement('div', 'bp-palette-group', metaLine(entry, now)))
        const actions = createElement('div', 'bp-recall-actions')
        actions.append(
          button('Insert', () => finish(() => insert(entry.text))),
          button('Send', () => finish(() => send(entry.text))),
          ...(queue ? [button('Queue', () => finish(() => queue(entry.text)))] : []),
          button('Copy', () => void copyText(entry.text).then((copied) => showToast(copied ? 'Copied.' : 'Could not copy.', [], 2_000))),
          button(entry.pinned ? 'Unpin' : 'Pin', () => {
            store.togglePin(entry.id)
            render()
          }),
          button('Delete', () => {
            store.remove(entry.id)
            render()
          })
        )
        item.append(main, actions)
        item.addEventListener('click', () => finish(() => insert(entry.text)))
        return item
      })
    )
    list.children[selected]?.scrollIntoView({ block: 'nearest' })
  }

  input.addEventListener('input', () => {
    selected = 0
    render()
  })
  input.addEventListener('keydown', (event) => {
    const entry = rows[selected]
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (rows.length) selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length
      render()
    } else if (event.key === 'Enter' && entry) {
      event.preventDefault()
      if (event.shiftKey) finish(() => send(entry.text))
      else if ((event.ctrlKey || event.metaKey) && queue) finish(() => queue(entry.text))
      else finish(() => insert(entry.text))
    } else if (event.altKey && event.code === 'KeyP' && entry) {
      event.preventDefault()
      store.togglePin(entry.id)
      render()
    } else if (event.altKey && event.key === 'Delete' && entry) {
      event.preventDefault()
      store.remove(entry.id)
      render()
    }
  })

  render()
  ui.show()
  input.focus()
}
