import { storage } from '../../core/storage'

export interface SplitterSettings {
  limit: number
  autoIntercept: boolean
  balanced: boolean
  mode: 'parts' | 'file'
}

const STORAGE_KEY = 'message-splitter:settings'

export const DEFAULT_SPLITTER_SETTINGS: Readonly<SplitterSettings> = { limit: 7_500, autoIntercept: true, balanced: true, mode: 'parts' }

export const loadSplitterSettings = (): SplitterSettings => ({ ...DEFAULT_SPLITTER_SETTINGS, ...storage.get<Partial<SplitterSettings>>(STORAGE_KEY, {}) })

export const saveSplitterSettings = (settings: SplitterSettings): void => storage.set(STORAGE_KEY, settings)