import { injectStyle } from '@nolly/core'
import { uiConfig } from '../../ui/config'

const CSS = `
.bp-code-v2 {
  position: relative;
  margin: 16px 0;
  overflow: hidden;
  border: 1px solid var(--bp-border);
  border-radius: 10px;
  background: var(--bp-bg);
  color: var(--bp-fg);
}
.bp-code-v2 * { box-sizing: border-box; }
.bp-code-v2 .bp-code-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--bp-border);
  background: var(--bp-accent);
}
.bp-code-v2 .bp-code-meta { display: flex; align-items: center; gap: 8px; min-width: 0; }
.bp-code-v2 .bp-code-lang { font: 600 12px system-ui, sans-serif; }
.bp-code-v2 .bp-code-file { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bp-code-v2 .bp-code-count, .bp-code-v2 .bp-code-file { color: var(--bp-muted); font-size: 11px; }
.bp-code-v2 .bp-code-actions { display: flex; flex-wrap: wrap; gap: 3px; }
.bp-code-v2 .bp-code-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--bp-muted);
  cursor: pointer;
}
.bp-code-v2 .bp-code-btn:hover,
.bp-code-v2 .bp-code-btn[aria-pressed='true'] {
  border-color: var(--bp-border);
  background: var(--bp-bg);
  color: var(--bp-fg);
}
.bp-code-v2 button:focus-visible,
.bp-code-v2 pre:focus-visible { outline: 2px solid var(--bp-ring); outline-offset: -2px; }
.bp-code-v2 .bp-code-body { overflow: auto; }
.bp-code-v2 .bp-code-scroll {
  display: flex;
  align-items: stretch;
  width: max-content;
  min-width: 100%;
  font: 13px/21px ui-monospace, "Cascadia Code", Consolas, monospace;
}
.bp-code-v2 .bp-code-gutter {
  flex: none;
  padding: 14px 12px;
  border-right: 1px solid var(--bp-border);
  color: var(--bp-muted);
  background: var(--bp-accent);
  white-space: pre;
  text-align: right;
  user-select: none;
  font: inherit;
}
.bp-code-v2 .bp-code-native-pre {
  flex: 1;
  min-width: 0;
  margin: 0 !important;
  padding: 14px 16px !important;
  border: 0 !important;
  background: transparent !important;
  color: inherit !important;
  font: inherit !important;
  white-space: pre !important;
  tab-size: 4;
  overflow: visible !important;
}
.bp-code-v2 .bp-code-source {
  display: block;
  padding: 0 !important;
  background: transparent !important;
  color: inherit;
  font: inherit !important;
  white-space: inherit !important;
}
.bp-code-v2[data-lines='false'] .bp-code-gutter,
.bp-code-v2[data-wrap='true'] .bp-code-gutter { display: none; }
.bp-code-v2[data-wrap='true'] .bp-code-scroll { width: 100%; }
.bp-code-v2[data-wrap='true'] .bp-code-native-pre {
  white-space: pre-wrap !important;
  overflow-wrap: anywhere;
}
.bp-code-v2[data-collapsed='true'] .bp-code-body {
  max-height: calc(var(--bp-code-collapse, 30) * 21px + 28px);
  overflow: hidden;
}
.bp-code-v2 .bp-code-more {
  display: none;
  width: 100%;
  padding: 9px;
  border: 0;
  border-top: 1px solid var(--bp-border);
  background: var(--bp-accent);
  color: var(--bp-fg);
  cursor: pointer;
}
.bp-code-v2[data-collapsed='true'] .bp-code-more { display: block; }
.bp-code-v2 ::selection { background: rgb(59 130 246 / 25%); }
.bp-code-v2 .bp-tok-comment { color: var(--bp-muted); font-style: italic; }
.bp-code-v2 .bp-tok-keyword { color: #a855f7; }
.bp-code-v2 .bp-tok-string { color: #b45309; }
.bp-code-v2 .bp-tok-number { color: #059669; }
.bp-code-v2 .bp-tok-fn { color: #2563eb; }
.bp-code-v2 .bp-tok-type { color: #0891b2; }
.bp-code-v2 .bp-tok-tag { color: #e11d48; }
.bp-code-v2 .bp-tok-attr, .bp-code-v2 .bp-tok-key { color: #2563eb; }
.bp-code-v2 .bp-lang-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 2px;
  border: 1px solid var(--bp-border);
  border-radius: 5px;
  color: var(--bp-fg);
  font: 600 10px system-ui, sans-serif;
}
`

export const ensureCodeStyles = (): void => injectStyle(`${uiConfig().id}-code-v2-styles`, CSS)
