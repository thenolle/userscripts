import { type Command, createElement } from '@nolly/core'
import { storage } from '../../platform'
import { createDialog } from '../../ui/dialog'
import { fuzzyScore } from './fuzzy'
import { ensurePaletteStyles } from './styles'
import { uiConfig } from '../../ui/config'

const DIALOG_ID = (): string => `${uiConfig().id}-palette`
const RECENT_KEY = 'command-palette:recent'
const MAX_RECENT = 6
const MAX_RESULTS = 60

const rank = (commands: readonly Command[], query: string, recent: readonly string[]): Command[] => {
  if (!query) {
    const order = (command: Command): number => {
      const index = recent.indexOf(command.id)
      return index === -1 ? recent.length : index
    }
    return [...commands].sort((a, b) => order(a) - order(b) || a.group.localeCompare(b.group) || a.title.localeCompare(b.title)).slice(0, MAX_RESULTS)
  }
  return commands.map((command) => ({ command, score: Math.max(fuzzyScore(query, command.title) * 2, fuzzyScore(query, `${command.group} ${command.title} ${command.keywords ?? ''}`)) })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS).map(({ command }) => command)
}

export const togglePalette = (getCommands: () => Command[]): void => {
  const existing = document.getElementById(DIALOG_ID())
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  ensurePaletteStyles()
  const ui = createDialog({ id: DIALOG_ID(), title: 'Command palette', width: 560 })
  ui.dialog.classList.add('bp-palette')
  const commands = getCommands()
  const input = createElement('input', 'bp-palette-input')
  input.placeholder = 'Type a command…'
  input.setAttribute('aria-label', 'Command')
  const list = createElement('div', 'bp-palette-list')
  list.setAttribute('role', 'listbox')
  ui.body.append(input, list)
  let results: Command[] = []
  let selected = 0
  const run = (command: Command): void => {
    const recent = [command.id, ...storage.get<string[]>(RECENT_KEY, []).filter((id) => id !== command.id)].slice(0, MAX_RECENT)
    storage.set(RECENT_KEY, recent)
    ui.close()
    window.setTimeout(() => void command.run(), 0)
  }
  const render = (): void => {
    results = rank(commands, input.value.trim(), storage.get<string[]>(RECENT_KEY, []))
    selected = Math.min(selected, Math.max(0, results.length - 1))
    if (!results.length) {
      list.replaceChildren(createElement('div', 'bp-palette-empty', 'No matching commands'))
      return
    }
    list.replaceChildren(
      ...results.map((command, index) => {
        const item = createElement('div', 'bp-palette-item')
        item.setAttribute('role', 'option')
        item.setAttribute('aria-selected', String(index === selected))
        item.append(createElement('span', undefined, command.title), createElement('span', 'bp-palette-group', command.group))
        item.addEventListener('click', () => run(command))
        item.addEventListener('pointermove', () => {
          if (selected === index) return
          selected = index
          render()
        })
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
      const step = event.key === 'ArrowDown' ? 1 : -1
      selected = (selected + step + results.length) % Math.max(1, results.length)
      render()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const command = results[selected]
      if (command) run(command)
    }
  })
  render()
  ui.show()
  input.focus()
}