export const CONFIG = {
  initializationDelay: 500,
  safetyInterval: 2_000
} as const

export const OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['class', 'aria-label', 'aria-expanded', 'aria-selected', 'aria-hidden', 'aria-pressed', 'data-state', 'hidden']
}

export const MESSAGE_TOKEN_LIMIT = 34_000
