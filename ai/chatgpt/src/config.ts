import type { SplitterSettings } from '@nolly/ai'

export const CONFIG = {
  initializationDelay: 1_500,
  safetyInterval: 2_000
} as const

export const SPLITTER_DEFAULTS: Partial<SplitterSettings> = { limit: 30_000 }

export const OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['class', 'aria-label', 'aria-expanded', 'aria-selected', 'aria-hidden', 'aria-pressed', 'data-state', 'hidden']
}
