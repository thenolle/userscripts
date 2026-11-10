import { storage } from '../../platform'
import type { Shortcut } from '../command-palette/shortcut'

export interface RecallSettings {
  paused: boolean
  retentionDays: number
  arrowHistory: boolean
}

const SETTINGS_KEY = 'recall:settings'
export const RECALL_SHORTCUT_KEY = 'recall:shortcut'

const DEFAULTS: Readonly<RecallSettings> = { paused: false, retentionDays: 180, arrowHistory: true }

export const DEFAULT_RECALL_SHORTCUT: Shortcut = { ctrl: false, alt: true, shift: true, meta: false, code: 'KeyH' }

export const loadRecallSettings = (): RecallSettings => ({ ...DEFAULTS, ...storage.get<Partial<RecallSettings>>(SETTINGS_KEY, {}) })

export const saveRecallSettings = (settings: RecallSettings): void => storage.set(SETTINGS_KEY, settings)

export const loadRecallShortcut = (): Shortcut => ({ ...DEFAULT_RECALL_SHORTCUT, ...storage.get<Partial<Shortcut>>(RECALL_SHORTCUT_KEY, {}) })
