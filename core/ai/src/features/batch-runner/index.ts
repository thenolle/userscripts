import { Feature, type MenuEntry, type ScriptContext } from '@nolly/core'
import { ComposerButton } from '../../ui/composer-button'
import { applyValues, findFields } from '../../placeholders'
import { askFields } from '../../ui/placeholder-dialog'
import { openBatchDialog, type BatchInput } from './dialog'
import { renderTemplate } from './template'
import { BatchPanel } from './panel'
import { BatchRunner, clearState, loadState, type BatchState } from './runner'

export class BatchRunnerFeature extends Feature {
  readonly id = 'batch-runner'
  readonly name = 'Batch Runner'
  readonly description = 'Send one templated message per item, one after another.'

  private readonly runner = new BatchRunner()
  private readonly panel = new BatchPanel()
  private readonly button = new ComposerButton('Batch runner', 'layers', 'Run a template over a list of items', () => this.open(), { id: 'batch', after: ['prompts', 'big'] })
  private offered = false

  constructor(context: ScriptContext) {
    super(context)
  }

  run(): void {
    if (!this.enabled) {
      this.button.unmount()
      return
    }
    this.button.mount()
    if (this.offered || this.runner.active) return
    const saved = loadState()
    if (!saved) return
    this.offered = true
    this.panel.offerResume(saved.prompts.length - saved.next, () => void this.start(saved), clearState)
  }

  override menuEntries(): MenuEntry[] {
    return [{ id: 'open', label: 'Batch Runner…', action: () => this.open() }]
  }

  private open(): void {
    if (this.runner.active) return
    openBatchDialog((input) => void this.prepare(input))
  }

  private async start(state: BatchState): Promise<void> {
    this.panel.running({ onPause: () => this.runner.pause(), onResume: () => this.runner.resume(), onCancel: () => this.runner.cancel(), isPaused: () => this.runner.isPaused })
    const result = await this.runner.run(state, (index, total, phase) => this.panel.update(index, total, phase))
    if (result === 'cancelled') clearState()
    this.panel.finish(result, () => this.context.runCommand('exporter:export'))
  }

  private async prepare({ template, items, delay }: BatchInput): Promise<void> {
    const fields = findFields(template, (key) => /^(item|index|total|date|\d+)$/.test(key))
    let filled = template
    if (fields.length) {
      const values = await askFields(fields, { title: 'Fill in the blanks', description: 'These are the same for every message in the batch.', confirm: 'Start batch' })
      if (!values) return
      filled = applyValues(template, values)
    }
    const prompts = items.map((item, index) => renderTemplate(filled, item, index, items.length))
    await this.start({ prompts, next: 0, delay, at: Date.now() })
  }
}