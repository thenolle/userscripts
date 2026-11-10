import { injectStyle } from '@nolly/core'
import { uiConfig } from '../../ui/config'

const CSS = `
.bp-recall .bp-palette-list { max-height: 340px; }
.bp-recall-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px 2px; }
.bp-recall-chip { padding: 3px 10px; border: 1px solid var(--bp-border); border-radius: 999px; background: transparent; color: var(--bp-muted); font: inherit; font-size: 11px; cursor: pointer; }
.bp-recall-chip:hover { background: var(--bp-accent); }
.bp-recall-chip[aria-pressed='true'] { background: var(--bp-accent); color: var(--bp-fg); font-weight: 600; }
.bp-recall-row { align-items: flex-start; }
.bp-recall-main { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.bp-recall-text { display: -webkit-box; overflow: hidden; word-break: break-word; white-space: pre-wrap; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.bp-recall-actions { display: none; flex-shrink: 0; flex-wrap: wrap; gap: 4px; justify-content: flex-end; max-width: 210px; }
.bp-recall-row:hover .bp-recall-actions, .bp-recall-row[aria-selected='true'] .bp-recall-actions { display: flex; }
.bp-recall-action { padding: 2px 8px; border: 1px solid var(--bp-border); border-radius: 6px; background: var(--bp-bg); color: var(--bp-fg); font: inherit; font-size: 11px; cursor: pointer; }
.bp-recall-action:hover { background: var(--bp-accent); }
.bp-recall-hint { padding: 8px 14px; border-top: 1px solid var(--bp-border); color: var(--bp-muted); font-size: 11px; }
`

export const ensureRecallStyles = (): void => injectStyle(`${uiConfig().id}-recall-styles`, CSS)
