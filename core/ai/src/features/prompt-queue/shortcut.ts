import { storage } from '../../platform'
import type { Shortcut } from '../command-palette/shortcut'

export const QUEUE_SHORTCUT_KEY = 'prompt-queue:shortcut'

export const DEFAULT_QUEUE_SHORTCUT: Shortcut = { ctrl: false, alt: true, shift: true, meta: false, code: 'KeyQ' }

export const loadQueueShortcut = (): Shortcut => ({ ...DEFAULT_QUEUE_SHORTCUT, ...storage.get<Partial<Shortcut>>(QUEUE_SHORTCUT_KEY, {}) })
