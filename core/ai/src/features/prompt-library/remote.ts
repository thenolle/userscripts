import { getText } from '@nolly/core'
import { logger, platform, storage } from '../../platform'
import type { Prompt } from './store'

interface Cache {
  at: number
  prompts: Prompt[]
}

const KEY = 'prompt-library:community'
const TTL = 24 * 3_600_000

const isPrompt = (value: unknown): value is Prompt => {
  const prompt = value as Partial<Prompt> | null
  return typeof prompt?.id === 'string' && typeof prompt.title === 'string' && typeof prompt.body === 'string'
}

export const loadCommunity = async (force = false): Promise<Prompt[]> => {
  const cached = storage.get<Cache | null>(KEY, null)
  if (cached && !force && Date.now() - cached.at < TTL) return cached.prompts
  try {
    const parsed = JSON.parse(await getText(`${platform().promptsUrl}?t=${Date.now()}`)) as { prompts?: unknown[] }
    const prompts = (parsed.prompts ?? []).filter(isPrompt)
    storage.set<Cache>(KEY, { at: Date.now(), prompts })
    return prompts
  } catch (error) {
    logger.warning('Could not load community prompts.', error)
    return cached?.prompts ?? []
  }
}