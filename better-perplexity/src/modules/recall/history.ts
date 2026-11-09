import { storage } from '../../core/storage'
import { threadOf } from '../prompt-queue/queue'
import { loadRecallSettings } from './settings'
import { HistoryStore } from './store'

export const history = new HistoryStore()

export const recordPrompt = (text: string): void => {
  if (!storage.get('module:recall', true) || loadRecallSettings().paused) return
  const entry = history.record(text, threadOf(location.pathname))
  if (!entry || threadOf(location.pathname) !== null) return
  window.setTimeout(() => {
    const thread = threadOf(location.pathname)
    if (thread) history.attach(entry.id, thread)
  }, 3_000)
}
