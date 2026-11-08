import { findComposer, sendComposer, writeComposer } from '../../core/composer'
import { waitForResponse } from '../../core/generation'
import { logger } from '../../core/logger'
import { isAbort, waitFor } from '../../core/wait'

export type PartStatus = 'sending' | 'waiting' | 'done'
export type RunResult = 'done' | 'cancelled' | 'failed'

export class SendRunner {
  private controller: AbortController | null = null

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
    try {
      for (let index = 0; index < parts.length; index++) {
        onStatus(index, 'sending')
        const composer = await waitFor(findComposer, { timeout: 15_000, signal })
        if (!composer) return 'failed'
        if (!(await writeComposer(composer, parts[index]!))) return 'failed'
        if (!(await sendComposer(composer))) return 'failed'
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