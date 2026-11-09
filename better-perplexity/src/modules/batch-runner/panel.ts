import { createElement } from '@nolly/core'
import { markUi } from '../../core/dom'
import { createButton } from '../../ui/controls'
import { ensureUiStyles } from '../../ui/styles'
import type { BatchPhase, BatchResult } from './runner'

const CSS_ID = 'better-perplexity-batch-styles'

const PHASE_TEXT: Readonly<Record<BatchPhase, string>> = { sending: 'sending', waiting: 'waiting for the answer', paused: 'paused', resting: 'resting' }

export class BatchPanel {
  private readonly element = markUi(createElement('div', 'bp-batch-panel bp-themed'))
  private readonly label = createElement('div')
  private readonly fill = createElement('div', 'bp-progress-fill')
  private readonly actions = createElement('div', 'bp-batch-actions')

  constructor() {
    ensureUiStyles()
    if (!document.getElementById(CSS_ID)) {
      const style = createElement('style')
      style.id = CSS_ID
      style.textContent = `
        .bp-batch-panel { position: fixed; right: 20px; bottom: 20px; z-index: 100000; display: flex; flex-direction: column; gap: 8px; width: 300px; padding: 12px 14px; border: 1px solid var(--bp-border); border-radius: 12px; background: var(--bp-bg); color: var(--bp-fg); box-shadow: 0 12px 32px rgb(0 0 0 / 22%); font-size: 12px; }
        .bp-batch-actions { display: flex; gap: 6px; flex-wrap: wrap; }
      `
      document.head.appendChild(style)
    }
    const bar = createElement('div', 'bp-progress')
    bar.appendChild(this.fill)
    this.element.append(this.label, bar, this.actions)
  }

  private mount(): void {
    if (!this.element.isConnected) document.body.appendChild(this.element)
  }

  private setActions(...buttons: HTMLElement[]): void {
    this.actions.replaceChildren(...buttons)
  }

  running(controls: { onPause: () => void; onResume: () => void; onCancel: () => void; isPaused: () => boolean }): void {
    const toggle = createButton('Pause', {
      onClick: () => {
        if (controls.isPaused()) {
          controls.onResume()
          toggle.textContent = 'Pause'
        } else {
          controls.onPause()
          toggle.textContent = 'Resume'
        }
      }
    })
    this.setActions(toggle, createButton('Cancel', { onClick: controls.onCancel }))
    this.mount()
  }

  update(index: number, total: number, phase: BatchPhase): void {
    this.label.textContent = `Item ${index + 1}/${total}: ${PHASE_TEXT[phase]}`
    this.fill.style.width = `${(((index + (phase === 'waiting' ? 0.6 : 0.2)) / total) * 100).toFixed(0)}%`
  }

  finish(result: BatchResult, onExport: () => void): void {
    this.label.textContent = result === 'finished' ? 'Batch finished.' : result === 'cancelled' ? 'Batch cancelled.' : 'Batch stopped: a message could not be sent.'
    this.fill.style.width = result === 'finished' ? '100%' : this.fill.style.width
    this.setActions(createButton('Export thread', { primary: true, onClick: onExport }), createButton('Close', { onClick: () => this.element.remove() }))
    this.mount()
  }

  offerResume(remaining: number, onResume: () => void, onDiscard: () => void): void {
    this.label.textContent = `An interrupted batch has ${remaining} items left.`
    this.fill.style.width = '0%'
    this.setActions(
      createButton('Resume', { primary: true, onClick: onResume }),
      createButton('Discard', {
        onClick: () => {
          onDiscard()
          this.element.remove()
        }
      })
    )
    this.mount()
  }
}