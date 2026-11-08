export const CONFIG = {
  initializationDelay: 500,
  safetyInterval: 2_000,
  usage: {
    refreshInterval: 60_000,
    refreshDelays: [3_000, 15_000, 45_000],
    sendUpdateDelays: [0, 250, 1_000, 3_000],
    tickInterval: 1_000,
    retryCooldown: 15_000
  }
} as const

export const OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['class', 'aria-label', 'aria-expanded', 'aria-selected', 'aria-hidden', 'data-state', 'hidden']
}