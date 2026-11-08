import { injectStyle } from '../../core/styles'

const CSS = `
.bp-code {
  --bp-edge: color-mix(in srgb, currentColor 13%, transparent);
  --bp-muted: color-mix(in srgb, currentColor 52%, transparent);
  --bp-hover: color-mix(in srgb, currentColor 9%, transparent);
  position: relative;
  margin: 14px 0;
  overflow: hidden;
  border: 1px solid var(--bp-edge);
  border-radius: 10px;
  background: color-mix(in srgb, currentColor 3.5%, transparent);
  font-size: 13px;
}

.bp-code * { box-sizing: border-box; }
.bp-code ::selection { background: color-mix(in srgb, #3b82f6 38%, transparent); }

.bp-code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 42px;
  padding: 0 8px 0 12px;
  border-bottom: 1px solid var(--bp-edge);
}

.bp-code-meta { display: flex; align-items: center; gap: 8px; min-width: 0; }
.bp-code-lang { font-size: 13px; font-weight: 500; white-space: nowrap; }
.bp-code-file { overflow: hidden; color: var(--bp-muted); font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; text-overflow: ellipsis; white-space: nowrap; }
.bp-code-count { color: var(--bp-muted); font-size: 12px; white-space: nowrap; }
.bp-code-count::before { content: '·'; margin-right: 8px; }
.bp-code-actions { display: flex; flex-shrink: 0; gap: 2px; }

.bp-code-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--bp-muted);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.bp-code-btn:hover { background: var(--bp-hover); color: inherit; }
.bp-code-btn[aria-pressed='true'] { background: var(--bp-hover); color: inherit; }
.bp-code-btn[data-done='true'] { color: hsl(142 71% 45%); }
.bp-code-btn:focus-visible { outline: 2px solid color-mix(in srgb, #3b82f6 70%, transparent); outline-offset: 1px; }

.bp-code-body { overflow: auto; }
.bp-code[data-collapsed='true'] .bp-code-body {
  max-height: calc(var(--bp-code-collapse, 30) * 1.6em + 28px);
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 64px), transparent);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 64px), transparent);
}

.bp-code-pre {
  width: max-content;
  min-width: 100%;
  margin: 0 !important;
  padding: 14px 0 !important;
  border: 0 !important;
  background: transparent !important;
  font: 13px/1.6 ui-monospace, 'Geist Mono', 'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace !important;
  overflow: visible !important;
  tab-size: 2;
  counter-reset: bp-line;
}

.bp-code-pre code { display: block; padding: 0 !important; background: transparent !important; font: inherit !important; }
.bp-code[data-wrap='true'] .bp-code-pre { width: auto; min-width: 0; }

.bp-line { display: flex; align-items: flex-start; counter-increment: bp-line; }
.bp-line:hover { background: color-mix(in srgb, currentColor 5%, transparent); }

.bp-num {
  flex: 0 0 calc(var(--bp-digits, 2) * 1ch + 30px);
  padding-right: 14px;
  color: var(--bp-muted);
  opacity: .7;
  text-align: right;
  user-select: none;
}

.bp-num::before { content: counter(bp-line); }
.bp-text { flex: 1; min-width: 0; min-height: 1.6em; padding-right: 16px; white-space: pre; }
.bp-code[data-lines='false'] .bp-num { display: none; }
.bp-code[data-lines='false'] .bp-text { padding-left: 16px; }
.bp-code[data-wrap='true'] .bp-text { white-space: pre-wrap; overflow-wrap: anywhere; }

.bp-line.add { background: hsl(142 71% 45% / 14%); }
.bp-line.del { background: hsl(0 84% 60% / 14%); }
.bp-line.hunk { color: var(--bp-muted); }

.bp-tok-comment { color: var(--bp-muted); font-style: italic; }
.bp-tok-string { color: color-mix(in srgb, hsl(28 82% 52%) 72%, currentColor); }
.bp-tok-number { color: color-mix(in srgb, hsl(160 60% 42%) 72%, currentColor); }
.bp-tok-keyword { color: color-mix(in srgb, hsl(285 65% 58%) 74%, currentColor); }
.bp-tok-fn { color: color-mix(in srgb, hsl(215 78% 56%) 74%, currentColor); }
.bp-tok-type { color: color-mix(in srgb, hsl(185 62% 42%) 74%, currentColor); }
.bp-tok-tag { color: color-mix(in srgb, hsl(350 70% 55%) 74%, currentColor); }
.bp-tok-attr { color: color-mix(in srgb, hsl(40 80% 48%) 74%, currentColor); }
.bp-tok-key { color: color-mix(in srgb, hsl(215 70% 55%) 74%, currentColor); }

.bp-code-more {
  position: absolute;
  bottom: 12px;
  left: 50%;
  display: none;
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--bp-edge);
  border-radius: 6px;
  background: color-mix(in srgb, currentColor 8%, Canvas);
  color: inherit;
  font: inherit;
  font-size: 12.5px;
  font-weight: 500;
  transform: translateX(-50%);
  cursor: pointer;
}

.bp-code[data-collapsed='true'] .bp-code-more { display: block; }
.bp-code-more:hover { background: color-mix(in srgb, currentColor 14%, Canvas); }

.bp-lang-icon { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; }
.bp-lang-badge {
  background: linear-gradient(145deg, var(--c), color-mix(in srgb, var(--c) 70%, #000));
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 20%), 0 1px 2px rgb(0 0 0 / 28%);
  font: 700 9.5px/1 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -.03em;
}
.bp-lang-badge[data-size='3'] { font-size: 8px; }
.bp-lang-badge[data-size='4'] { font-size: 6.8px; letter-spacing: -.05em; }
.bp-lang-plain { color: var(--bp-muted); }
`

export const ensureCodeStyles = (): void => injectStyle('better-perplexity-code-styles', CSS)