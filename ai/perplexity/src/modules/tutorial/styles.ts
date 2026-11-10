import { injectStyle } from '@nolly/core'

const CSS = `
.bp-tour { position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; }
.bp-tour-hole { position: fixed; border-radius: 12px; box-shadow: 0 0 0 9999px rgb(0 0 0 / 58%); transition: left 220ms ease, top 220ms ease, width 220ms ease, height 220ms ease; }
.bp-tour-hole[data-pulse='true'] { outline: 2px solid #3b82f6; animation: bp-tour-pulse 1.4s ease-in-out infinite; }
@keyframes bp-tour-pulse { 0%, 100% { outline-offset: 0; } 50% { outline-offset: 5px; } }
.bp-tour-card { position: fixed; display: flex; flex-direction: column; gap: 8px; width: min(340px, calc(100vw - 24px)); padding: 16px; border: 1px solid var(--bp-border); border-radius: 14px; background: var(--bp-bg); color: var(--bp-fg); box-shadow: 0 16px 40px rgb(0 0 0 / 35%); font: 13px/1.5 ui-sans-serif, system-ui, sans-serif; pointer-events: auto; }
.bp-tour-count { color: var(--bp-muted); font-size: 11px; }
.bp-tour-title { font-size: 15px; font-weight: 650; }
.bp-tour-hint { padding: 7px 10px; border-radius: 8px; background: var(--bp-accent); font-size: 12px; font-weight: 500; }
.bp-tour-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px; }
@media (prefers-reduced-motion: reduce) { .bp-tour-hole, .bp-tour-hole[data-pulse='true'] { transition: none; animation: none; } }
`

export const ensureTourStyles = (): void => injectStyle('better-perplexity-tour-styles', CSS)