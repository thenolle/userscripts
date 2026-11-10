import { createElement } from '@nolly/core'
import { createDialog } from '../../ui/dialog'
import { fuzzyScore } from '../command-palette/fuzzy'
import { ensurePaletteStyles } from '../command-palette/styles'
import type { Prompt, PromptStore } from './store'
import { uiConfig } from '../../ui/config'

const DIALOG_ID = (): string => `${uiConfig().id}-prompt-picker`

export interface PickerOptions {
  store: PromptStore
  community: () => Promise<Prompt[]>
  onPick: (prompt: Prompt) => void
  onSave: (prompt: Prompt) => void
  onManage: () => void
}

interface Row {
  title: string
  hint: string
  run: () => void
  save?: () => void
}

export const togglePromptPicker = ({ store, community, onPick, onSave, onManage }: PickerOptions): void => {
  const existing = document.getElementById(DIALOG_ID())
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  ensurePaletteStyles()
  const ui = createDialog({ id: DIALOG_ID(), title: 'Prompts', width: 600 })
  ui.dialog.classList.add('bp-palette')
  const mine = store.list()
  let shared: Prompt[] = []
  const input = createElement('input', 'bp-palette-input')
  input.placeholder = 'Search your prompts and community prompts…'
  const list = createElement('div', 'bp-palette-list')
  ui.body.append(input, list)
  let rows: Row[] = []
  let selected = 0
  const run = (row: Row): void => {
    ui.close()
    window.setTimeout(row.run, 0)
  }
  const rank = (prompts: readonly Prompt[], query: string): Prompt[] => prompts.map((prompt) => ({ prompt, score: query ? fuzzyScore(query, `${prompt.title} ${prompt.body}`) : 1 })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).map(({ prompt }) => prompt)
  const render = (): void => {
    const query = input.value.trim()
    const owned = new Set(mine.map((prompt) => prompt.title))
    rows = [
      ...rank(mine, query).map((prompt): Row => ({ title: prompt.title, hint: prompt.body.replace(/\s+/g, ' ').slice(0, 70), run: () => onPick(prompt) })),
      ...rank(shared, query).filter((prompt) => !owned.has(prompt.title)).map((prompt): Row => ({ title: prompt.title, hint: `Community · ${prompt.body.replace(/\s+/g, ' ').slice(0, 56)}`, run: () => onPick(prompt), save: () => onSave(prompt) })),
      { title: 'Manage prompts…', hint: '', run: onManage }
    ]
    selected = Math.min(selected, rows.length - 1)
    list.replaceChildren(
      ...rows.map((row, index) => {
        const item = createElement('div', 'bp-palette-item')
        item.setAttribute('aria-selected', String(index === selected))
        item.append(createElement('span', undefined, row.title), createElement('span', 'bp-palette-group', row.hint))
        if (row.save) {
          const save = createElement('button', 'bp-button', 'Save')
          save.type = 'button'
          save.addEventListener('click', (event) => {
            event.stopPropagation()
            row.save?.()
            save.textContent = 'Saved'
            save.disabled = true
          })
          item.appendChild(save)
        }
        item.addEventListener('click', () => run(row))
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
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length
      render()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const row = rows[selected]
      if (row) run(row)
    }
  })
  void community().then((prompts) => {
    shared = prompts
    render()
  })
  render()
  ui.show()
  input.focus()
}