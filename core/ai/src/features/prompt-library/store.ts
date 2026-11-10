import { storage } from '../../platform'

export interface Prompt {
  id: string
  title: string
  body: string
}

const STORAGE_KEY = 'prompt-library:prompts'

const DEFAULTS: readonly Prompt[] = [
  { id: 'summarize', title: 'Summarize selection', body: 'Summarize the following in 5 bullet points:\n\n{{selection}}' },
  { id: 'explain', title: 'Explain simply', body: 'Explain this simply, with one example:\n\n{{clipboard}}' },
  { id: 'review', title: 'Code review', body: 'Review this code for bugs, security and readability. Be specific and concise:\n\n{{clipboard}}' }
]

const newId = (): string => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export class PromptStore {
  list(): Prompt[] {
    return storage.get<Prompt[] | null>(STORAGE_KEY, null) ?? DEFAULTS.map((prompt) => ({ ...prompt }))
  }

  upsert(prompt: Prompt): void {
    const prompts = this.list()
    const index = prompts.findIndex((candidate) => candidate.id === prompt.id)
    if (index >= 0) prompts[index] = prompt
    else prompts.push(prompt)
    storage.set(STORAGE_KEY, prompts)
  }

  remove(id: string): void {
    storage.set(STORAGE_KEY, this.list().filter((prompt) => prompt.id !== id))
  }

  create(): Prompt {
    return { id: newId(), title: '', body: '' }
  }

  saveCopy(prompt: Pick<Prompt, 'title' | 'body'>): void {
    this.upsert({ id: newId(), title: prompt.title, body: prompt.body })
  }

  exportJson(): string {
    return JSON.stringify(this.list().map(({ title, body }) => ({ title, body })), null, 2)
  }

  importJson(text: string): number {
    const parsed: unknown = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('Expected a JSON array.')
    const added = parsed.filter((item): item is { title: string; body: string } => typeof item?.title === 'string' && typeof item?.body === 'string')
    storage.set(STORAGE_KEY, [...this.list(), ...added.map(({ title, body }) => ({ id: newId(), title, body }))])
    return added.length
  }
}