import { findComposer, sendComposer, writeComposer } from '../../platform'
import { readComposer } from '../../composer'
import { rememberSelection } from '../../selection'
import { ensureUiStyles } from '../../ui/styles'
import { askFields } from '../../ui/placeholder-dialog'
import { createElement, Feature, injectStyle, type MenuEntry } from '@nolly/core'
import { isOwnUi, markUi, uiConfig } from '../../ui/config'

interface Action {
  id: string
  label: string
  title: string
  compose: (quote: string) => Promise<string | null>
}

const CSS = `
.bp-sel { position: fixed; z-index: 99996; display: none; gap: 2px; padding: 4px; border: 1px solid var(--bp-border); border-radius: 10px; background: var(--bp-bg); box-shadow: 0 8px 24px rgb(0 0 0 / 22%); }
.bp-sel[data-visible='true'] { display: flex; }
.bp-sel button { padding: 5px 10px; border: 0; border-radius: 6px; background: transparent; color: var(--bp-fg); font: 12.5px ui-sans-serif, system-ui, sans-serif; cursor: pointer; }
.bp-sel button:hover { background: var(--bp-accent); }
`

const MIN_LENGTH = 2
const quote = (text: string): string => text.split('\n').map((line) => `> ${line}`).join('\n')

const ACTIONS: readonly Action[] = [
  {
    id: 'ask',
    label: 'Ask',
    title: 'Ask a question about this',
    compose: async (selected) => {
      const answers = await askFields([{ key: 'question', label: 'Your question about the selected text', long: true }], { title: 'Ask about this', description: selected.slice(0, 160), confirm: 'Insert' })
      return answers?.['question']?.trim() ? `${quote(selected)}\n\n${answers['question'].trim()}` : null
    }
  },
  { id: 'explain', label: 'Explain', title: 'Explain this simply', compose: async (selected) => `Explain this simply, with one example:\n\n${quote(selected)}` },
  { id: 'summarize', label: 'Summarize', title: 'Summarize this', compose: async (selected) => `Summarize this in a few bullet points:\n\n${quote(selected)}` },
  { id: 'check', label: 'Fact-check', title: 'Fact-check this', compose: async (selected) => `Fact-check this claim. Cite sources and say what is right, wrong or uncertain:\n\n${quote(selected)}` },
  { id: 'quote', label: 'Quote', title: 'Quote in the message box', compose: async (selected) => `${quote(selected)}\n\n` }
]

export class SelectionToolbarFeature extends Feature {
  readonly id = 'selection-toolbar'
  readonly name = 'Selection Toolbar'
  readonly description = 'Ask, explain, summarize or quote any selected text.'

  private readonly bar = markUi(createElement('div', 'bp-sel bp-themed'))
  private selected = ''
  private timer = 0

  constructor(context: ConstructorParameters<typeof Feature>[0]) {
    super(context)
    ensureUiStyles()
    injectStyle(`${uiConfig().id}-selection-styles`, CSS)
    for (const action of ACTIONS) {
      const button = createElement('button', undefined, action.label)
      button.type = 'button'
      button.title = `${action.title} (Shift-click sends)`
      button.addEventListener('mousedown', (event) => event.preventDefault())
      button.addEventListener('click', (event) => void this.apply(action, event.shiftKey))
      this.bar.appendChild(button)
    }
    document.addEventListener('mouseup', this.schedule)
    document.addEventListener('keyup', this.schedule)
    document.addEventListener('scroll', this.hide, true)
    document.addEventListener('mousedown', this.handleMouseDown, true)
  }

  run(): void {
    if (!this.enabled) this.hide()
  }

  override menuEntries(): MenuEntry[] {
    return []
  }

  private readonly schedule = (): void => {
    window.clearTimeout(this.timer)
    this.timer = window.setTimeout(() => this.update(), 30)
  }

  private readonly hide = (): void => {
    this.bar.dataset['visible'] = 'false'
  }

  private readonly handleMouseDown = (event: MouseEvent): void => {
    if (!(event.target instanceof Node && this.bar.contains(event.target))) this.hide()
  }

  private update(): void {
    const selection = window.getSelection()
    const text = selection?.toString().trim() ?? ''
    const anchor = selection?.anchorNode
    const host = anchor instanceof Element ? anchor : anchor?.parentElement
    if (!this.enabled || !selection || selection.isCollapsed || text.length < MIN_LENGTH || !host || isOwnUi(host) || host.closest('textarea, input, [contenteditable], dialog')) {
      this.hide()
      return
    }
    this.selected = text
    rememberSelection(text)
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    if (!this.bar.isConnected) document.body.appendChild(this.bar)
    this.bar.dataset['visible'] = 'true'
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - this.bar.offsetWidth / 2), window.innerWidth - this.bar.offsetWidth - 8)
    this.bar.style.left = `${left}px`
    this.bar.style.top = `${Math.max(8, rect.top - this.bar.offsetHeight - 8)}px`
  }

  private async apply(action: Action, send: boolean): Promise<void> {
    const selected = this.selected
    this.hide()
    const composed = await action.compose(selected)
    const composer = findComposer()
    if (composed === null || !composer) return
    const existing = readComposer(composer).trim()
    await writeComposer(composer, existing ? `${existing}\n\n${composed}` : composed)
    if (send) await sendComposer(composer)
  }
}