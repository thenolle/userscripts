import type { ScriptStorage } from '@nolly/core'

export type Modifier = 'ctrl' | 'alt' | 'meta' | 'shift'
export type ShortcutSettings = Record<Modifier, boolean>

interface ShortcutOption {
  readonly key: Modifier
  readonly label: string
  readonly flag: 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey'
}

const STORAGE_KEY = 'enter-as-newline:shortcuts'

export const SHORTCUT_OPTIONS: readonly ShortcutOption[] = [
  { key: 'ctrl', label: 'Ctrl + Enter', flag: 'ctrlKey' },
  { key: 'alt', label: 'Alt + Enter', flag: 'altKey' },
  { key: 'meta', label: 'Meta / Cmd + Enter', flag: 'metaKey' },
  { key: 'shift', label: 'Shift + Enter', flag: 'shiftKey' }
]

export const DEFAULT_SHORTCUTS: Readonly<ShortcutSettings> = { ctrl: true, alt: false, meta: true, shift: false }

export const loadShortcuts = (storage: ScriptStorage): ShortcutSettings => {
  const saved = storage.get<Partial<ShortcutSettings>>(STORAGE_KEY, DEFAULT_SHORTCUTS)
  const entries = SHORTCUT_OPTIONS.map(({ key }) => [key, typeof saved?.[key] === 'boolean' ? saved[key] : DEFAULT_SHORTCUTS[key]])
  return Object.fromEntries(entries) as ShortcutSettings
}

export const saveShortcuts = (storage: ScriptStorage, settings: ShortcutSettings): void => storage.set(STORAGE_KEY, settings)

export const matchesShortcut = (event: KeyboardEvent, settings: ShortcutSettings): boolean => {
  const pressed = SHORTCUT_OPTIONS.filter(({ flag }) => event[flag])
  return pressed.length === 1 && settings[pressed[0]!.key]
}

export const hasModifier = (event: KeyboardEvent): boolean => SHORTCUT_OPTIONS.some(({ flag }) => event[flag])

export const describeShortcuts = (settings: ShortcutSettings): string => {
  const labels = SHORTCUT_OPTIONS.filter(({ key }) => settings[key]).map(({ label }) => label)
  return labels.length ? `Sends with: ${labels.join(', ')}. Plain Enter inserts a newline.` : 'No send shortcut selected: messages can only be sent with the button.'
}
