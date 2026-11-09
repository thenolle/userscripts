export interface RecorderDeps {
  readonly now: () => number
  readonly composerText: () => string | null
  readonly isAutomating: () => boolean
  readonly commit: (text: string) => void
}

interface Pending {
  readonly text: string
  readonly at: number
}

const SETTLE_AFTER = 1_200
const EXPIRE_AFTER = 10_000

export class SendRecorder {
  private pending: Pending | null = null

  constructor(private readonly deps: RecorderDeps) {}

  intent(text: string): void {
    const clean = text.trim()
    if (!clean || this.deps.isAutomating()) return
    this.pending = { text: clean, at: this.deps.now() }
  }

  request(): void {
    const pending = this.pending
    if (!pending) return
    this.pending = null
    this.deps.commit(pending.text)
  }

  tick(): void {
    const pending = this.pending
    if (!pending) return
    const age = this.deps.now() - pending.at
    if (age > EXPIRE_AFTER) {
      this.pending = null
      return
    }
    if (age < SETTLE_AFTER) return
    const current = this.deps.composerText()
    if (current !== null && current.trim() === '') {
      this.pending = null
      this.deps.commit(pending.text)
    }
  }
}
