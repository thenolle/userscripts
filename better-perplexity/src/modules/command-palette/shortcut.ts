import { storage } from '../../core/storage'

export interface Shortcut {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  code: string
}

const STORAGE_KEY = 'command-palette:shortcut'
const MODIFIER_CODES = /^(Control|Alt|Shift|Meta|OS)(Left|Right)?$/

export const DEFAULT_SHORTCUT: Readonly<Shortcut> = { ctrl: false, alt: true, shift: true, meta: false, code: 'KeyP' }

export const loadShortcut = (): Shortcut => ({ ...DEFAULT_SHORTCUT, ...storage.get<Partial<Shortcut>>(STORAGE_KEY, {}) })

export const saveShortcut = (shortcut: Shortcut): void => storage.set(STORAGE_KEY, shortcut)

export const matchesShortcut = (event: KeyboardEvent, shortcut: Shortcut): boolean => event.code === shortcut.code && event.ctrlKey === shortcut.ctrl && event.altKey === shortcut.alt && event.shiftKey === shortcut.shift && event.metaKey === shortcut.meta

export const formatShortcut = (shortcut: Shortcut): string => {
  const parts = [shortcut.ctrl && 'Ctrl', shortcut.alt && 'Alt', shortcut.shift && 'Shift', shortcut.meta && 'Meta'].filter(Boolean)
  return [...parts, shortcut.code.replace(/^(Key|Digit)/, '')].join(' + ')
}

export const shortcutFromEvent = (event: KeyboardEvent): Shortcut | null => {
  if (MODIFIER_CODES.test(event.code) || !(event.ctrlKey || event.altKey || event.metaKey)) return null
  return { ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey, meta: event.metaKey, code: event.code }
}