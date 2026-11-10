import { isAbort } from '@nolly/core'
import { threadOf, type PromptQueue } from './queue'

export type Phase = 'idle' | 'waiting' | 'sending' | 'paused' | 'moved' | 'draft' | 'error'

export interface RunnerDeps {
  readonly path: () => string
  readonly isGenerating: () => boolean
  readonly waitForResponse: (signal: AbortSignal, startTimeout: number) => Promise<unknown>
  readonly composerText: () => string | null
  readonly send: (text: string, signal: AbortSignal) => Promise<boolean>
  readonly settlePath: (before: string, signal: AbortSignal) => Promise<string>
  readonly onSent?: (text: string) => void
}

const MAX_FAILURES = 2

export class QueueRunner {
  phase: Phase = 'idle'
  paused: boolean
  lock: string | null = null
  private busy = false
  private force = false
  private failures = 0
  private controller: AbortController | null = null
  private skipWait: (() => void) | null = null
  private readonly listeners = new Set<() => void>()

  constructor(
    private readonly queue: PromptQueue,
    private readonly deps: RunnerDeps,
    startPaused: boolean
  ) {
    this.paused = startPaused && queue.size > 0
  }

  get running(): boolean {
    return this.busy
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  pause(): void {
    this.paused = true
    this.kick()
    this.emit()
  }

  resume(): void {
    this.paused = false
    this.failures = 0
    this.kick()
    this.emit()
  }

  retry(): void {
    this.failures = 0
    this.kick()
  }

  moveHere(): void {
    this.lock = null
    this.queue.retarget(threadOf(this.deps.path()))
    this.kick()
  }

  sendNow(): void {
    this.force = true
    this.skipWait?.()
    this.kick()
  }

  stop(): void {
    this.controller?.abort()
  }

  kick(): void {
    if (this.busy) return
    if (!this.queue.peek()) {
      this.lock = null
      this.failures = 0
      this.set('idle')
      return
    }
    const blocker = this.blocker()
    if (blocker) {
      this.set(blocker)
      return
    }
    void this.cycle()
  }

  private blocker(): Phase | null {
    if (this.paused) return 'paused'
    if (this.failures >= MAX_FAILURES) return 'error'
    const item = this.queue.peek()
    if (!item) return null
    const path = this.deps.path()
    const expected = item.thread ?? this.lock
    if (expected !== null ? path !== expected : threadOf(path) !== null) return 'moved'
    const draft = this.deps.composerText()
    if (draft === null || draft.trim() !== '') return 'draft'
    return null
  }

  private async cycle(): Promise<void> {
    this.busy = true
    const controller = new AbortController()
    this.controller = controller
    try {
      this.set('waiting')
      if (!this.force && this.deps.isGenerating()) await this.interruptible(controller, (signal) => this.deps.waitForResponse(signal, 0))
      const blocker = this.blocker()
      if (blocker) {
        this.set(blocker)
        return
      }
      const item = this.queue.peek()
      if (!item) return
      this.set('sending')
      const before = this.deps.path()
      if (!(await this.deps.send(item.text, controller.signal))) {
        this.failures++
        this.set(this.failures >= MAX_FAILURES ? 'error' : 'waiting')
        return
      }
      this.failures = 0
      this.force = false
      this.queue.remove(item.id)
      this.deps.onSent?.(item.text)
      if (item.thread === null && this.lock === null) {
        const after = await this.deps.settlePath(before, controller.signal)
        if (threadOf(after) !== null) this.lock = after
      }
      this.set('waiting')
      await this.interruptible(controller, (signal) => this.deps.waitForResponse(signal, 15_000))
    } catch (error) {
      if (isAbort(error)) {
        this.set('idle')
        return
      }
      this.failures = MAX_FAILURES
      this.set('error')
    } finally {
      this.busy = false
      this.controller = null
      if (!controller.signal.aborted) setTimeout(() => this.kick(), 0)
    }
  }

  private async interruptible(outer: AbortController, task: (signal: AbortSignal) => Promise<unknown>): Promise<void> {
    const inner = new AbortController()
    const onAbort = (): void => inner.abort()
    outer.signal.addEventListener('abort', onAbort, { once: true })
    this.skipWait = () => inner.abort()
    try {
      await task(inner.signal)
    } catch (error) {
      if (!isAbort(error) || outer.signal.aborted) throw error
    } finally {
      this.skipWait = null
      outer.signal.removeEventListener('abort', onAbort)
    }
  }

  private set(phase: Phase): void {
    if (this.phase === phase) return
    this.phase = phase
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}
