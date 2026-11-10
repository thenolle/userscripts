import { storage } from '../../platform'
import type { Shortcut } from '../command-palette/shortcut'

export const PROMPT_SHORTCUT_KEY = 'prompt-library:shortcut'

export const DEFAULT_PROMPT_SHORTCUT: Shortcut = { ctrl: false, alt: true, shift: true, meta: false, code: 'KeyL' }

export const loadPromptShortcut = (): Shortcut => ({ ...DEFAULT_PROMPT_SHORTCUT, ...storage.get<Partial<Shortcut>>(PROMPT_SHORTCUT_KEY, {}) })