import { injectStyle } from '@nolly/core'

const CSS = `
.bp-draft-meter,
.bp-draft-banner {
  position: fixed;
  z-index: 99990;
  display: none;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border: 1px solid var(--bp-border);
  border-radius: 999px;
  background: var(--bp-bg);
  color: var(--bp-fg);
  box-shadow: 0 4px 14px rgb(0 0 0 / 14%);
  font: 11px/1.4 ui-sans-serif, system-ui, sans-serif;
  white-space: nowrap;
}

.bp-draft-meter[data-visible='true'],
.bp-draft-banner[data-visible='true'] { display: inline-flex; }

.bp-draft-meter[data-level='warn'] { border-color: var(--bp-yellow); color: var(--bp-yellow); }
.bp-draft-meter[data-level='danger'] { border-color: var(--bp-red); color: var(--bp-red); }
.bp-draft-meter button,
.bp-draft-banner button {
  padding: 1px 8px;
  border: 1px solid var(--bp-border);
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.bp-draft-meter button:hover,
.bp-draft-banner button:hover { background: var(--bp-accent); }
.bp-draft-meter button[hidden] { display: none; }
`

export const ensureDraftStyles = (): void => injectStyle('better-perplexity-draft-styles', CSS)