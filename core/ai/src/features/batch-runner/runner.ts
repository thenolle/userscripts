import { automate } from '../../automation'
import { readComposer } from '../../composer'
import { findComposer, sendComposer, writeComposer, waitForResponse, logger, storage } from '../../platform'
import { isAbort, sleep, waitFor } from '@nolly/core'

export interface BatchState {
  prompts: string[]
  next: number
  delay: number
  at: number
}

export type BatchPhase = 'sending' | 'waiting' | 'paused' | 'resting'
export type BatchResult = 'finished' | 'cancelled' | 'failed'

const STORAGE_KEY = 'batch-runner:state'
const MAX_AGE = 6 * 3_600_000

export const loadState = (): BatchState | null => {
  const state = storage.get<BatchState | null>(STORAGE_KEY, null)
  return state && state.next < state.prompts.length && Date.now() - state.at < MAX_AGE ? state : null
}

export const clearState = (): void => storage.set<BatchState | null>(STORAGE_KEY, null)

export class BatchRunner {
  private controller: AbortController | null = null
  private paused = false
  private release: (() => void) | null = null

  get active(): boolean {
    return this.controller !== null
  }

  get isPaused(): boolean {
    return this.paused
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
    this.release?.()
  }

  cancel(): void {
    this.controller?.abort()
    this.resume()
  }

  async run(state: BatchState, onProgress: (index: number, total: number, phase: BatchPhase) => void): Promise<BatchResult> {
    if (this.controller) return 'failed'
    const controller = new AbortController()
    this.controller = controller
    const { signal } = controller
    const total = state.prompts.length
    try {
      return await automate(async () => {
        for (let index = state.next; index < total; index++) {
          while (this.paused) {
            onProgress(index, total, 'paused')
            await new Promise<void>((resolve) => {
              this.release = resolve
              signal.addEventListener('abort', () => resolve(), { once: true })
            })
          }
          signal.throwIfAborted()
          onProgress(index, total, 'sending')
          if (!(await this.send(state.prompts[index]!, signal))) return 'failed'
          onProgress(index, total, 'waiting')
          await waitForResponse({ signal })
          storage.set<BatchState>(STORAGE_KEY, { ...state, next: index + 1, at: Date.now() })
          if (state.delay > 0 && index < total - 1) {
            onProgress(index, total, 'resting')
            await sleep(state.delay * 1_000, signal)
          }
        }
        clearState()
        return 'finished'
      })
    } catch (error) {
      if (isAbort(error)) return 'cancelled'
      logger.error('Batch run failed.', error)
      return 'failed'
    } finally {
      this.controller = null
      this.paused = false
    }
  }

  private async send(prompt: string, signal: AbortSignal): Promise<boolean> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const composer = await waitFor(findComposer, { timeout: 15_000, signal })
      if (!composer) return false
      if ((await writeComposer(composer, prompt)) && (await sendComposer(composer))) return true
      if (readComposer(composer).trim() === '') return true
      await sleep(1_500, signal)
    }
    return false
  }
}