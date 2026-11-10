import { injectStyle } from '@nolly/core'

const CSS = `
.bp-usage-indicator { gap: 6px; }

.bp-gear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: 1px solid var(--bp-border);
  border-radius: 999px;
  background: var(--bp-bg);
  color: var(--bp-fg);
  cursor: pointer;
  transition: background 120ms ease;
}

.bp-gear:hover { background: var(--bp-accent); }
.bp-gear:focus-visible { outline: 2px solid var(--bp-fg); outline-offset: 2px; }
`

export const ensureGearStyles = (): void => injectStyle('better-perplexity-gear-styles', CSS)
