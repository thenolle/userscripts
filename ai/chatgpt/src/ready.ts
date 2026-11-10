import { findComposerForm } from './locate'

const FALLBACK_MS = 15_000

const ready = (): boolean => document.readyState === 'complete' && findComposerForm() !== null

export const whenReady = (run: () => void): void => {
  if (ready()) {
    run()
    return
  }
  const started = Date.now()
  const timer = window.setInterval(() => {
    if (!ready() && Date.now() - started < FALLBACK_MS) return
    window.clearInterval(timer)
    run()
  }, 250)
}
