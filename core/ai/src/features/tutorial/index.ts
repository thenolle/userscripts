import { Feature, createElement } from '@nolly/core'
import type { MenuEntry, ScriptContext } from '@nolly/core'
import { platform, storage } from '../../platform'
import { markUi, uiConfig } from '../../ui/config'
import { createButton } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import { createIcon } from '../../ui/icons'
import { ensureUiStyles } from '../../ui/styles'
import { showToast } from '../../ui/toast'
import { Tooltip } from '../../ui/tooltip'
import { TourRunner } from './engine'
import type { Tour } from './source'

const SEEN_KEY = 'tutorial:seen'
const FIRST_RUN_DELAY = 5_000

const fullTour = (): Tour => ({ id: 'all', title: 'Full tour', summary: 'Everything above, in order.', steps: platform().tutorial.tours.flatMap((tour) => tour.steps) })

export class TutorialFeature extends Feature {
  readonly id = 'tutorial'
  readonly name = 'Tutorial'
  readonly description = 'Interactive guided tours of every feature.'

  private readonly runner = new TourRunner()
  private readonly button = markUi(createElement('button', 'bp-header-btn bp-help bp-themed'))
  private readonly tooltip: Tooltip
  private offered = false

  constructor(context: ScriptContext) {
    super(context)
    ensureUiStyles()
    this.button.type = 'button'
    this.button.setAttribute('aria-label', `How to use ${uiConfig().title}`)
    this.button.appendChild(createIcon('help'))
    this.button.addEventListener('click', () => this.choose())
    this.tooltip = new Tooltip(this.button, (container) => container.append(createElement('div', 'bp-tip-mode', 'How to use'), createElement('div', 'bp-tip-sub', 'Interactive guided tours')))
  }

  run(): void {
    if (!this.enabled || !platform().tutorial.place(this.button)) {
      this.tooltip.hide()
      this.button.remove()
      return
    }
    this.offerFirstRun()
  }

  override menuEntries(): MenuEntry[] {
    return [
      { id: 'open', label: 'How to Use (Tutorial)…', action: () => this.choose() },
      { id: 'full', label: 'Run the Full Tour', action: () => this.start(fullTour()) }
    ]
  }

  private offerFirstRun(): void {
    if (this.offered || storage.get(SEEN_KEY, false)) return
    this.offered = true
    const first = platform().tutorial.tours[0]
    if (!first) return
    window.setTimeout(
      () =>
        showToast(
          `New here? Take a one-minute tour of ${uiConfig().title}.`,
          [
            { label: 'Start tour', primary: true, onClick: () => this.start(first) },
            { label: 'No thanks', onClick: () => storage.set(SEEN_KEY, true) }
          ],
          0
        ),
      FIRST_RUN_DELAY
    )
  }

  private start(tour: Tour): void {
    storage.set(SEEN_KEY, true)
    this.runner.start(tour.steps)
  }

  private choose(): void {
    const dialogId = `${uiConfig().id}-tour-chooser`
    const existing = document.getElementById(dialogId)
    if (existing instanceof HTMLDialogElement) {
      existing.close()
      return
    }
    const ui = createDialog({ id: dialogId, title: 'How to use', description: 'Pick a guided tour. Each one highlights real buttons and asks you to try them.', width: 560 })
    const stack = createElement('div', 'bp-stack')
    for (const tour of platform().tutorial.tours) {
      const row = createElement('div', 'bp-prompt-row')
      const text = createElement('div')
      text.append(createElement('div', undefined, tour.title), createElement('div', 'bp-data-label', `${tour.summary} · ${tour.steps.length} steps`))
      row.append(
        text,
        createButton('Start', {
          primary: true,
          onClick: () => {
            ui.close()
            window.setTimeout(() => this.start(tour), 0)
          }
        })
      )
      stack.appendChild(row)
    }
    ui.body.appendChild(stack)
    ui.footer.append(
      createButton('Close', { onClick: ui.close }),
      createButton('Run the full tour', {
        primary: true,
        onClick: () => {
          ui.close()
          window.setTimeout(() => this.start(fullTour()), 0)
        }
      })
    )
    ui.show()
  }
}
