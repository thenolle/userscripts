import type { ScriptStorage } from '@nolly/core'

export interface Draft {
  text: string
  at: number
}

type Drafts = Record<string, Draft>

const STORAGE_KEY = 'draft-guard:drafts'
const TTL = 30 * 86_400_000
const MAX_DRAFTS = 50
const MAX_CHARS = 200_000

export class DraftStore {
  constructor(private readonly storage: ScriptStorage) {}

  get(key: string): Draft | null {
    const draft = this.read()[key]
    return draft && Date.now() - draft.at < TTL ? draft : null
  }

  set(key: string, text: string): void {
    if (!text.replace(/[\s\u200b]/g, '')) return
    const drafts = this.read()
    drafts[key] = { text: text.slice(0, MAX_CHARS), at: Date.now() }
    this.write(this.prune(drafts))
  }

  remove(key: string): void {
    const drafts = this.read()
    if (!(key in drafts)) return
    delete drafts[key]
    this.write(drafts)
  }

  private read(): Drafts {
    return this.storage.get<Drafts>(STORAGE_KEY, {})
  }

  private write(drafts: Drafts): void {
    this.storage.set(STORAGE_KEY, drafts)
  }

  private prune(drafts: Drafts): Drafts {
    const live = Object.entries(drafts).filter(([, draft]) => Date.now() - draft.at < TTL)
    live.sort((a, b) => b[1].at - a[1].at)
    return Object.fromEntries(live.slice(0, MAX_DRAFTS))
  }
}
