export const CONFIG = {
  initializationDelay: 500,
  safetyInterval: 2_000,
  usage: {
    refreshInterval: 60_000,
    focusInterval: 15_000,
    focusSpan: 600_000,
    pollTick: 5_000,
    visibleStaleAfter: 10_000,
    refreshDelays: [1_000, 3_000, 8_000, 20_000, 45_000],
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
