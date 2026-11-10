import { injectStyle } from '@nolly/core'

const CSS = `
.bp-queue { position: fixed; right: 20px; bottom: 112px; z-index: 100000; display: flex; flex-direction: column; width: 340px; max-width: calc(100vw - 40px); border: 1px solid var(--bp-border); border-radius: 12px; background: var(--bp-bg); color: var(--bp-fg); box-shadow: 0 12px 32px rgb(0 0 0 / 22%); font: 12px/1.45 ui-sans-serif, system-ui, sans-serif; }
.bp-queue-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; }
.bp-queue-toggle { display: inline-flex; align-items: center; gap: 8px; padding: 4px 6px; border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.bp-queue-toggle:hover { background: var(--bp-accent); }
.bp-queue-count { min-width: 20px; padding: 0 6px; border-radius: 999px; background: var(--bp-accent); font-size: 11px; font-weight: 600; text-align: center; }
.bp-queue-status { color: var(--bp-muted); font-size: 11px; text-align: right; }
.bp-queue[data-phase='moved'] .bp-queue-status, .bp-queue[data-phase='draft'] .bp-queue-status { color: var(--bp-yellow); }
.bp-queue[data-phase='error'] .bp-queue-status { color: var(--bp-red); }
.bp-queue-list { display: flex; flex-direction: column; gap: 4px; max-height: 220px; margin: 0; padding: 0 8px 4px; overflow-y: auto; list-style: none; }
.bp-queue-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 8px; border: 1px solid var(--bp-border); border-radius: 8px; }
.bp-queue-index { flex-shrink: 0; width: 18px; color: var(--bp-muted); font-variant-numeric: tabular-nums; }
.bp-queue-text { display: -webkit-box; flex: 1; min-width: 0; overflow: hidden; word-break: break-word; white-space: pre-wrap; cursor: text; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.bp-queue-edit { display: flex; flex: 1; flex-direction: column; gap: 6px; min-width: 0; }
.bp-queue-edit-actions { display: flex; gap: 6px; }
.bp-queue-actions { display: flex; flex-shrink: 0; gap: 2px; }
.bp-queue-actions .bp-icon-button:disabled { opacity: 0.3; cursor: default; }
.bp-queue-footer { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 10px 10px; }
.bp-queue[data-collapsed='true'] .bp-queue-head { padding-bottom: 8px; }
`

export const ensureQueueStyles = (): void => injectStyle('better-perplexity-queue-styles', CSS)
