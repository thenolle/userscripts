import { isAbort, waitFor } from '@nolly/core'
import type { Logger } from '@nolly/core'
import type { ComposerKit } from '../../composer'
import type { GenerationKit } from '../../generation'

export type PartStatus = 'sending' | 'waiting' | 'done'
export type RunResult = 'done' | 'cancelled' | 'failed'

export interface RunnerDeps {
  readonly composer: Pick<ComposerKit, 'findComposer' | 'writeComposer' | 'sendComposer'>
  readonly waitForResponse: GenerationKit['waitForResponse']
  readonly logger: Logger
}

export class SendRunner {
  private controller: AbortController | null = null

  constructor(private readonly deps: RunnerDeps) {}

  get active(): boolean {
    return this.controller !== null
  }

  cancel(): void {
    this.controller?.abort()
  }

  async run(parts: readonly string[], onStatus: (index: number, status: PartStatus) => void): Promise<RunResult> {
    if (this.controller) return 'failed'
    const controller = new AbortController()
    this.controller = controller
    const { signal } = controller
    const { composer: kit, waitForResponse, logger } = this.deps
    try {
      for (let index = 0; index < parts.length; index++) {
        onStatus(index, 'sending')
        const composer = await waitFor(kit.findComposer, { timeout: 15_000, signal })
        if (!composer) return 'failed'
        if (!(await kit.writeComposer(composer, parts[index]!))) return 'failed'
        if (!(await kit.sendComposer(composer))) return 'failed'
        if (index < parts.length - 1) {
          onStatus(index, 'waiting')
          await waitForResponse({ signal })
        }
        onStatus(index, 'done')
      }
      return 'done'
    } catch (error) {
      if (isAbort(error)) return 'cancelled'
      logger.error('Message splitter run failed.', error)
      return 'failed'
    } finally {
      this.controller = null
    }
  }
}
