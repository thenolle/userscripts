import { createElement } from '@nolly/core'
import { markUi } from '../../core/dom'
import { estimateTokens } from '../../core/tokens'
import { createButton, createNumberField, createSelectField, createSwitch, createTextArea } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import { ensureUiStyles } from '../../ui/styles'
import { planParts, type SplitPlan } from './plan'
import type { PartStatus } from './runner'
import type { SplitterSettings } from './settings'
import { ensureSplitterStyles } from './styles'

const DIALOG_ID = 'better-perplexity-splitter-dialog'
const PREVIEW_CHARS = 6_000

export interface SplitChoice {
  mode: SplitterSettings['mode']
  plan: SplitPlan
  instruction: string
}

export interface SplitDialogRequest {
  text: string
  settings: SplitterSettings
  onSettings: (settings: SplitterSettings) => void
  onConfirm: (choice: SplitChoice) => void
}

export const formatNumber = (value: number): string => value.toLocaleString()

export const createPartRows = (plan: SplitPlan): HTMLElement[] =>
  plan.parts.map((part, index) => {
    const details = createElement('details', 'bp-split-part')
    const head = createElement('summary')
    head.append(createElement('span', undefined, `Part ${index + 1}`), createElement('span', 'bp-data-label', `${formatNumber(plan.tokens[index] ?? 0)} tokens`))
    details.append(head, createElement('pre', undefined, part.length > PREVIEW_CHARS ? `${part.slice(0, PREVIEW_CHARS)}\n…` : part))
    return details
  })

export const openSplitDialog = ({ text, settings, onSettings, onConfirm }: SplitDialogRequest): void => {
  if (document.getElementById(DIALOG_ID)) return
  const ui = createDialog({ id: DIALOG_ID, title: 'Message splitter', description: `This message is about ${formatNumber(estimateTokens(text))} tokens.`, width: 640 })
  const state: SplitterSettings = { ...settings }
  let instruction = ''
  let plan: SplitPlan = planParts(text, instruction, state.limit, state.balanced)
  const summary = createElement('div', 'bp-split-summary')
  const list = createElement('div', 'bp-stack')
  const confirm = createButton('', { primary: true })
  const render = (): void => {
    plan = planParts(text, instruction, state.limit, state.balanced)
    const count = plan.parts.length
    summary.textContent = `${count} ${count === 1 ? 'part' : 'parts'} · limit ${formatNumber(state.limit)} tokens each. Every part sent uses one query.`
    list.replaceChildren(...createPartRows(plan))
    confirm.textContent = state.mode === 'file' ? 'Attach as file' : count > 1 ? `Send ${count} parts` : 'Send'
  }
  const update = (patch: Partial<SplitterSettings>): void => {
    Object.assign(state, patch)
    onSettings({ ...state })
    render()
  }
  const limit = createNumberField({ label: 'Tokens per part', hint: 'Estimate, with a safety margin built in', value: state.limit, min: 500, max: 100_000, step: 100, onChange: (value) => update({ limit: value }) })
  const mode = createSelectField('Mode', [
    { value: 'parts', label: 'Send in parts' },
    { value: 'file', label: 'Attach as file (no extra queries)' }
  ], state.mode, (value) => update({ mode: value }))
  const auto = createSwitch({ label: 'Offer to split when sending an oversized message', checked: state.autoIntercept, onChange: (value) => update({ autoIntercept: value }) })
  const finalInstruction = createTextArea('Instruction appended to the last part (optional)', '', (value) => {
    instruction = value
    render()
  })
  const options = createElement('div', 'bp-stack')
  options.append(limit.wrapper, mode, auto.wrapper, finalInstruction)
  ui.body.append(options, createElement('div', 'bp-hint'), summary, list)
  confirm.addEventListener('click', () => {
    ui.close()
    onConfirm({ mode: state.mode, plan, instruction })
  })
  ui.footer.append(createButton('Cancel', { onClick: ui.close }), confirm)
  render()
  ui.show()
}

const STATUS_TEXT: Readonly<Record<PartStatus, string>> = { sending: 'sending', waiting: 'waiting for the reply', done: 'done' }

export class ProgressPanel {
  private readonly element = markUi(createElement('div', 'bp-split-panel bp-themed'))
  private readonly label = createElement('div')
  private readonly fill = createElement('div', 'bp-progress-fill')
  private readonly cancel = createButton('Cancel')
  private timer = 0

  constructor() {
    ensureUiStyles()
    ensureSplitterStyles()
    const bar = createElement('div', 'bp-progress')
    bar.appendChild(this.fill)
    this.element.append(this.label, bar, this.cancel)
  }

  show(total: number, onCancel: () => void): void {
    this.cancel.hidden = false
    this.cancel.onclick = onCancel
    this.fill.style.width = '0%'
    this.label.textContent = `Preparing ${total} parts…`
    this.mount()
  }

  update(index: number, total: number, status: PartStatus): void {
    this.label.textContent = `Part ${index + 1}/${total}: ${STATUS_TEXT[status]}`
    this.fill.style.width = `${(((index + (status === 'done' ? 1 : 0.5)) / total) * 100).toFixed(0)}%`
  }

  finish(message: string): void {
    this.label.textContent = message
    this.cancel.hidden = true
    this.autoHide(4_000)
  }

  notify(message: string): void {
    this.label.textContent = message
    this.fill.style.width = '0%'
    this.cancel.hidden = true
    this.mount()
    this.autoHide(3_500)
  }

  private mount(): void {
    window.clearTimeout(this.timer)
    if (!this.element.isConnected) document.body.appendChild(this.element)
  }

  private autoHide(ms: number): void {
    window.clearTimeout(this.timer)
    this.timer = window.setTimeout(() => this.element.remove(), ms)
  }
}