import type { ScriptStorage } from '@nolly/core'

export interface SplitterSettings {
  limit: number
  autoIntercept: boolean
  balanced: boolean
  mode: 'parts' | 'file'
}

const STORAGE_KEY = 'message-splitter:settings'

export const DEFAULT_SPLITTER_SETTINGS: Readonly<SplitterSettings> = { limit: 7_500, autoIntercept: true, balanced: true, mode: 'parts' }

export const loadSplitterSettings = (storage: ScriptStorage, defaults: Partial<SplitterSettings> = {}): SplitterSettings => ({
  ...DEFAULT_SPLITTER_SETTINGS,
  ...defaults,
  ...storage.get<Partial<SplitterSettings>>(STORAGE_KEY, {})
})

export const saveSplitterSettings = (storage: ScriptStorage, settings: SplitterSettings): void => storage.set(STORAGE_KEY, settings)
