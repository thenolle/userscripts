import { createElement } from '@nolly/core'
import { estimateTokens } from '../../core/tokens'
import { createButton, createNumberField, createSelectField, createTextArea } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import { createPartRows, formatNumber, type SplitChoice } from './dialog'
import { planParts, type SplitPlan } from './plan'
import type { SplitterSettings } from './settings'
import { ensureSplitterStyles } from './styles'

const DIALOG_ID = 'better-perplexity-bigtext-dialog'

export interface BigTextRequest {
  settings: SplitterSettings
  onSettings: (settings: SplitterSettings) => void
  onInsert: (text: string) => void
  onSend: (text: string, choice: SplitChoice) => void
}

export const openBigTextDialog = ({ settings, onSettings, onInsert, onSend }: BigTextRequest): void => {
  if (document.getElementById(DIALOG_ID)) return
  ensureSplitterStyles()
  const ui = createDialog({ id: DIALOG_ID, title: 'Compose a big message', description: 'Paste any amount of text. It is split only if it is too big for one message.', width: 760 })
  const state: SplitterSettings = { ...settings }
  let text = ''
  let instruction = ''
  let plan: SplitPlan = planParts('', '', state.limit, state.balanced)
  const area = createTextArea('Paste your message here…', '', (value) => {
    text = value
    render()
  })
  area.rows = 14
  const status = createElement('div', 'bp-split-summary')
  const list = createElement('div', 'bp-stack')
  const insertButton = createButton('Insert into composer')
  const sendButton = createButton('', { primary: true })
  const update = (patch: Partial<SplitterSettings>): void => {
    Object.assign(state, patch)
    onSettings({ ...state })
    render()
  }
  const limit = createNumberField({ label: 'Tokens per message', hint: 'Estimate, with a safety margin built in', value: state.limit, min: 500, max: 100_000, step: 100, onChange: (value) => update({ limit: value }) })
  const oversize = createElement('div', 'bp-stack')
  oversize.append(
    createSelectField('When too big', [
      { value: 'parts', label: 'Send in parts' },
      { value: 'file', label: 'Attach as file (no extra queries)' }
    ], state.mode, (value) => update({ mode: value })),
    createTextArea('Instruction appended to the last part (optional)', '', (value) => {
      instruction = value
      render()
    }),
    list
  )
  const render = (): void => {
    const tokens = estimateTokens(text)
    const oversized = tokens > state.limit
    plan = planParts(text, instruction, state.limit, state.balanced)
    const count = plan.parts.length
    const empty = !text.trim()
    oversize.hidden = !oversized
    insertButton.hidden = oversized
    insertButton.disabled = empty
    sendButton.disabled = empty
    list.replaceChildren(...(oversized ? createPartRows(plan) : []))
    if (empty) status.textContent = 'Waiting for text…'
    else if (!oversized) status.textContent = `~${formatNumber(tokens)} tokens: fits in one message (limit ${formatNumber(state.limit)}).`
    else status.textContent = `~${formatNumber(tokens)} tokens: too big for one message. ${state.mode === 'file' ? 'It will be attached as a file.' : `It will be sent as ${count} parts, and each part uses one query.`}`
    sendButton.textContent = oversized ? (state.mode === 'file' ? 'Attach as file' : `Send ${count} parts`) : 'Send'
  }
  insertButton.addEventListener('click', () => {
    ui.close()
    onInsert(text)
  })
  sendButton.addEventListener('click', () => {
    const oversized = estimateTokens(text) > state.limit
    ui.close()
    onSend(text, { mode: oversized ? state.mode : 'parts', plan, instruction })
  })
  const stack = createElement('div', 'bp-stack')
  stack.append(area, status, limit.wrapper, oversize)
  ui.body.appendChild(stack)
  ui.footer.append(createButton('Cancel', { onClick: ui.close }), insertButton, sendButton)
  render()
  ui.show()
  area.focus()
}