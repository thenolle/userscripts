import { createElement } from '@nolly/core'
import { createButton, createNumberField, createSwitch, createTextArea } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import { parseItems, renderTemplate } from './template'
import { uiConfig } from '../../ui/config'

const DIALOG_ID = (): string => `${uiConfig().id}-batch-dialog`
const MAX_ITEMS = 200
const PREVIEWS = 3

export interface BatchInput {
  template: string
  items: string[]
  delay: number
}

interface Example {
  label: string
  template: string
  items: string
}

const EXAMPLES: readonly Example[] = [
  { label: 'Research companies', template: 'Give me a short profile of {{item}}: what they do, funding, main competitors.', items: 'Stripe\nNotion\nLinear' },
  { label: 'Translate sentences', template: 'Translate to French and explain any tricky words: "{{item}}"', items: 'Good morning, how are you?\nThe meeting was moved to Friday.' },
  { label: 'Summarize pages', template: 'Summarize this page in 3 bullet points: {{item}}', items: 'https://example.com/a\nhttps://example.com/b' }
]

const section = (step: number, title: string, help: string, tour: string): { root: HTMLElement; body: HTMLElement } => {
  const root = createElement('section', 'bp-stack')
  root.dataset['tour'] = tour
  const heading = createElement('div')
  heading.append(createElement('div', 'bp-dialog-title', `${step}. ${title}`), createElement('div', 'bp-dialog-description', help))
  const body = createElement('div', 'bp-stack')
  root.append(heading, body)
  return { root, body }
}

export const openBatchDialog = (onStart: (input: BatchInput) => void): void => {
  if (document.getElementById(DIALOG_ID())) return
  const ui = createDialog({ id: DIALOG_ID(), title: 'Batch Runner', description: 'Send the same kind of message many times, one after another, in this conversation.', width: 700 })
  let template = ''
  let items = ''
  let delay = 2
  let confirmed = false
  const start = createButton('Start', { primary: true })
  const count = createElement('div', 'bp-split-summary')
  const previews = createElement('div', 'bp-stack')
  const cost = createElement('div', 'bp-hint')
  const first = section(1, 'Write your message', 'Put {{item}} where each list entry should go. Example: Give me a short profile of {{item}}.', 'batch-template')
  const templateArea = createTextArea('Give me a short profile of {{item}}.', '', (value) => {
    template = value
    render()
  })
  templateArea.rows = 3
  const examples = createElement('div', 'bp-actions')
  examples.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center'
  examples.appendChild(createElement('span', 'bp-data-label', 'Not sure? Try an example:'))
  for (const example of EXAMPLES) examples.appendChild(createButton(example.label, {
    onClick: () => {
      template = example.template
      items = example.items
      templateArea.value = template
      itemsArea.value = items
      render()
    }
  }))
  first.body.append(templateArea, examples)
  const second = section(2, 'Paste your list', 'One entry per line. Each line becomes one message. For several columns, separate them with commas and use {{1}}, {{2}}…', 'batch-items')
  const itemsArea = createTextArea('Stripe\nNotion\nLinear', '', (value) => {
    items = value
    render()
  })
  itemsArea.rows = 6
  second.body.append(itemsArea, count)
  const third = section(3, 'Review and run', 'Check the first messages below. The runner sends them one by one and waits for each answer before sending the next.', 'batch-review')
  third.body.append(
    previews,
    createNumberField({ label: 'Pause between messages', hint: 'Seconds. A short pause is kinder to your limits.', value: delay, min: 0, max: 300, onChange: (value) => (delay = value) }).wrapper,
    cost,
    createSwitch({
      label: 'I understand every message uses one query',
      checked: false,
      onChange: (value) => {
        confirmed = value
        render()
      }
    }).wrapper
  )
  const render = (): void => {
    const list = parseItems(items)
    const tooMany = list.length > MAX_ITEMS
    const hasItemSlot = /\{\{\s*(item|\d+)\s*\}\}/.test(template)
    count.textContent = list.length ? `${list.length} ${list.length === 1 ? 'entry' : 'entries'} found.` : 'No entries yet.'
    previews.replaceChildren(
      ...list.slice(0, PREVIEWS).map((item, index) => {
        const card = createElement('div', 'bp-split-part')
        card.style.cssText = 'padding:10px 12px;white-space:pre-wrap;font-size:12px'
        card.textContent = `${index + 1}. ${renderTemplate(template, item, index, list.length)}`
        return card
      })
    )
    if (list.length > PREVIEWS) previews.appendChild(createElement('div', 'bp-data-label', `…and ${list.length - PREVIEWS} more.`))
    cost.textContent = tooMany ? `Too many entries (${list.length}). The maximum is ${MAX_ITEMS}.` : !template.trim() ? 'Write your message in step 1.' : !hasItemSlot ? 'Tip: add {{item}} to your message so each entry is included. Without it, every message is identical.' : `This will send ${list.length} messages and use ${list.length} queries. Other {{blanks}} in your message are asked once before starting.`
    start.disabled = !list.length || tooMany || !template.trim() || !confirmed
  }
  start.addEventListener('click', () => {
    const list = parseItems(items)
    ui.close()
    onStart({ template, items: list, delay })
  })
  const stack = createElement('div', 'bp-stack')
  stack.style.gap = '20px'
  stack.append(first.root, second.root, third.root)
  ui.body.appendChild(stack)
  ui.footer.append(createButton('Cancel', { onClick: ui.close }), start)
  render()
  ui.show()
}