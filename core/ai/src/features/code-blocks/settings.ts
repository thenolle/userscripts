import { storage } from '../../platform'

export interface CodeBlockSettings {
  collapseAfter: number
  wrap: boolean
  lineNumbers: boolean
  hideSiteChrome: boolean
  highlight: 'builtin' | 'site' | 'plain'
}

const STORAGE_KEY = 'code-blocks:settings'

export const DEFAULT_CODE_SETTINGS: Readonly<CodeBlockSettings> = {
  collapseAfter: 30,
  wrap: false,
  lineNumbers: true,
  hideSiteChrome: true,
  highlight: 'builtin'
}

export const loadCodeSettings = (): CodeBlockSettings => ({ ...DEFAULT_CODE_SETTINGS, ...storage.get<Partial<CodeBlockSettings>>(STORAGE_KEY, {}) })

export const saveCodeSettings = (settings: CodeBlockSettings): void => storage.set(STORAGE_KEY, settings)