import { injectStyle } from '@nolly/core'

const CSS = `
.bp-split-summary { margin-bottom: 12px; color: var(--bp-muted); font-size: 12px; }
.bp-split-part { border: 1px solid var(--bp-border); border-radius: 10px; }
.bp-split-part summary { display: flex; justify-content: space-between; gap: 12px; padding: 8px 12px; cursor: pointer; }
.bp-split-part pre { max-height: 220px; margin: 0 12px 12px; padding: 10px; overflow: auto; border-radius: 8px; background: var(--bp-accent); font: 11px/1.5 ui-monospace, monospace; white-space: pre-wrap; word-break: break-word; }

.bp-split-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 280px;
  padding: 12px 14px;
  border: 1px solid var(--bp-border);
  border-radius: 12px;
  background: var(--bp-bg);
  color: var(--bp-fg);
  box-shadow: 0 12px 32px rgb(0 0 0 / 22%);
  font-size: 12px;
}
`

export const ensureSplitterStyles = (): void => injectStyle('better-perplexity-splitter-styles', CSS)