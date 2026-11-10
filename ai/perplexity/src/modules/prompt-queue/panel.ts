import { createElement } from '@nolly/core'
import { markUi } from '../../core/dom'
import { storage } from '../../core/storage'
import { createButton } from '../../ui/controls'
import { createIcon } from '../../ui/icons'
import { ensureUiStyles } from '../../ui/styles'
import type { PromptQueue, QueueItem } from './queue'
import type { Phase, QueueRunner } from './runner'
import { ensureQueueStyles } from './styles'

const COLLAPSED_KEY = 'prompt-queue:collapsed'

const STATUS: Readonly<Record<Phase, string>> = {
  idle: 'Ready',
  waiting: 'Waiting for the answer to finish…',
  sending: 'Sending…',
  paused: 'Paused',
  moved: 'You left the thread these messages were queued for.',
  draft: 'Waiting for the message box to be empty.',
  error: 'Could not send. Check the message box, then retry.'
}

export class QueuePanel {
  private readonly element = markUi(createElement('aside', 'bp-queue bp-themed'))
  private editing: string | null = null
  private collapsed = storage.get(COLLAPSED_KEY, false)

  constructor(
    private readonly queue: PromptQueue,
    private readonly runner: QueueRunner
  ) {
    ensureUiStyles()
    ensureQueueStyles()
    this.element.setAttribute('aria-label', 'Message queue')
  }

  render(): void {
    const items = this.queue.list()
    if (!items.length) {
      this.editing = null
      this.element.remove()
      return
    }
    if (this.editing && this.element.contains(document.activeElement)) return
    if (!this.element.isConnected) document.body.appendChild(this.element)
    this.element.dataset['collapsed'] = String(this.collapsed)
    this.element.dataset['phase'] = this.runner.paused ? 'paused' : this.runner.phase
    this.element.replaceChildren(this.header(items.length), ...(this.collapsed ? [] : [this.list(items), this.footer()]))
  }

  detach(): void {
    this.editing = null
    this.element.remove()
  }

  private header(count: number): HTMLElement {
    const head = createElement('div', 'bp-queue-head')
    const toggle = createElement('button', 'bp-queue-toggle')
    toggle.type = 'button'
    toggle.setAttribute('aria-expanded', String(!this.collapsed))
    toggle.append(createIcon('queue', 14), createElement('span', undefined, 'Queue'), createElement('span', 'bp-queue-count', String(count)))
    toggle.addEventListener('click', () => {
      this.collapsed = !this.collapsed
      storage.set(COLLAPSED_KEY, this.collapsed)
      this.render()
    })
    head.append(toggle, createElement('span', 'bp-queue-status', this.runner.paused ? STATUS.paused : STATUS[this.runner.phase]))
    return head
  }

  private list(items: readonly QueueItem[]): HTMLElement {
    const list = createElement('ol', 'bp-queue-list')
    items.forEach((item, index) => list.appendChild(this.row(item, index, items.length)))
    return list
  }

  private row(item: QueueItem, index: number, total: number): HTMLElement {
    const row = createElement('li', 'bp-queue-item')
    const actions = createElement('div', 'bp-queue-actions')
    actions.append(
      this.iconButton('↑', 'Move up', index === 0, () => this.queue.move(item.id, -1)),
      this.iconButton('↓', 'Move down', index === total - 1, () => this.queue.move(item.id, 1)),
      this.iconButton('×', 'Remove', false, () => this.queue.remove(item.id))
    )
    row.append(createElement('span', 'bp-queue-index', String(index + 1)), this.editing === item.id ? this.editor(item) : this.text(item), actions)
    return row
  }

  private text(item: QueueItem): HTMLElement {
    const text = createElement('div', 'bp-queue-text', item.text)
    text.title = 'Click to edit'
    text.addEventListener('click', () => {
      this.editing = item.id
      this.render()
    })
    return text
  }

  private editor(item: QueueItem): HTMLElement {
    const wrap = createElement('div', 'bp-queue-edit')
    const area = createElement('textarea', 'bp-input')
    area.value = item.text
    area.rows = 3
    const stop = (): void => {
      this.editing = null
      this.render()
    }
    const save = (): void => {
      this.editing = null
      this.queue.update(item.id, area.value)
      this.render()
    }
    area.addEventListener('keydown', (event) => {
      event.stopPropagation()
      if (event.key === 'Escape') {
        event.preventDefault()
        stop()
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        save()
      }
    })
    const actions = createElement('div', 'bp-queue-edit-actions')
    actions.append(createButton('Save', { primary: true, onClick: save }), createButton('Cancel', { onClick: stop }))
    wrap.append(area, actions)
    queueMicrotask(() => area.focus())
    return wrap
  }

  private footer(): HTMLElement {
    const { runner } = this
    const footer = createElement('div', 'bp-queue-footer')
    footer.appendChild(createButton(runner.paused ? 'Resume' : 'Pause', { primary: runner.paused, onClick: () => (runner.paused ? runner.resume() : runner.pause()) }))
    if (!runner.paused && runner.phase === 'waiting') footer.appendChild(createButton('Send next now', { onClick: () => runner.sendNow() }))
    if (!runner.paused && runner.phase === 'moved') footer.appendChild(createButton('Send here instead', { primary: true, onClick: () => runner.moveHere() }))
    if (runner.phase === 'error') footer.appendChild(createButton('Retry', { primary: true, onClick: () => runner.retry() }))
    footer.appendChild(createButton('Clear', { onClick: () => this.queue.clear() }))
    return footer
  }

  private iconButton(label: string, name: string, disabled: boolean, onClick: () => void): HTMLButtonElement {
    const button = createElement('button', 'bp-icon-button', label)
    button.type = 'button'
    button.disabled = disabled
    button.setAttribute('aria-label', name)
    button.addEventListener('click', onClick)
    return button
  }
}
