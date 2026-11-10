import { createElement, Feature, type MenuEntry, type ScriptContext } from '@nolly/core'
import { markUi } from '../../core/dom'
import { storage } from '../../core/storage'
import { createButton, createDialog, createIcon, ensureUiStyles, showToast, Tooltip } from '@nolly/ai'
import { TourRunner } from './engine'
import { FULL_TOUR, TOURS, type Tour } from './tours'

const SEEN_KEY = 'tutorial:seen'
const CHOOSER_ID = 'better-perplexity-tour-chooser'
const FIRST_RUN_DELAY = 5_000

export class TutorialModule extends Feature {
  readonly id = 'tutorial'
  readonly name = 'Tutorial'
  readonly description = 'Interactive guided tours of every feature.'

  private readonly runner = new TourRunner()
  private readonly button = markUi(createElement('button', 'bp-header-btn bp-help'))
  private readonly tooltip: Tooltip
  private offered = false

  constructor(context: ScriptContext) {
    super(context)
    ensureUiStyles()
    this.button.type = 'button'
    this.button.setAttribute('aria-label', 'How to use Better Perplexity')
    this.button.appendChild(createIcon('help'))
    this.button.addEventListener('click', () => this.choose())
    this.tooltip = new Tooltip(this.button, (container) => container.append(createElement('div', 'bp-tip-mode', 'How to use'), createElement('div', 'bp-tip-sub', 'Interactive guided tours')))
  }

  run(): void {
    const indicator = document.querySelector<HTMLElement>('.bp-usage-indicator')
    if (!this.enabled || !indicator) {
      this.tooltip.hide()
      this.button.remove()
      return
    }
    const anchor = indicator.querySelector('.bp-export') ?? indicator.querySelector('.bp-gear')
    if (this.button.parentElement !== indicator || (anchor && this.button.nextElementSibling !== anchor)) indicator.insertBefore(this.button, anchor)
    this.offerFirstRun()
  }

  override menuEntries(): MenuEntry[] {
    return [
      { id: 'open', label: 'How to Use (Tutorial)…', action: () => this.choose() },
      { id: 'full', label: 'Run the Full Tour', action: () => this.start(FULL_TOUR) }
    ]
  }

  private offerFirstRun(): void {
    if (this.offered || storage.get(SEEN_KEY, false)) return
    this.offered = true
    window.setTimeout(() => showToast('New here? Take a one-minute tour of Better Perplexity.', [
      { label: 'Start tour', primary: true, onClick: () => this.start(TOURS[0]!) },
      { label: 'No thanks', onClick: () => storage.set(SEEN_KEY, true) }
    ], 0), FIRST_RUN_DELAY)
  }

  private start(tour: Tour): void {
    storage.set(SEEN_KEY, true)
    this.runner.start(tour.steps)
  }

  private choose(): void {
    const existing = document.getElementById(CHOOSER_ID)
    if (existing instanceof HTMLDialogElement) {
      existing.close()
      return
    }
    const ui = createDialog({ id: CHOOSER_ID, title: 'How to use', description: 'Pick a guided tour. Each one highlights real buttons and asks you to try them.', width: 560 })
    const stack = createElement('div', 'bp-stack')
    for (const tour of TOURS) {
      const row = createElement('div', 'bp-prompt-row')
      const text = createElement('div')
      text.append(createElement('div', undefined, tour.title), createElement('div', 'bp-data-label', `${tour.summary} · ${tour.steps.length} steps`))
      row.append(text, createButton('Start', {
        primary: true,
        onClick: () => {
          ui.close()
          window.setTimeout(() => this.start(tour), 0)
        }
      }))
      stack.appendChild(row)
    }
    ui.body.appendChild(stack)
    ui.footer.append(
      createButton('Close', { onClick: ui.close }),
      createButton('Run the full tour', {
        primary: true,
        onClick: () => {
          ui.close()
          window.setTimeout(() => this.start(FULL_TOUR), 0)
        }
      })
    )
    ui.show()
  }
}