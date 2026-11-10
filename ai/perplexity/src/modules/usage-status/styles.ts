import { injectStyle } from '@nolly/core'

const USAGE_CSS = `
.bp-usage-indicator {
  --bp-dot: var(--bp-muted);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  font-family: inherit;
  vertical-align: middle;
  z-index: 1000;
}
.bp-usage-indicator[data-status='healthy'] { --bp-dot: var(--bp-green); }
.bp-usage-indicator[data-status='low'] { --bp-dot: var(--bp-yellow); }
.bp-usage-indicator[data-status='critical'],
.bp-usage-indicator[data-status='empty'] { --bp-dot: var(--bp-red); }

.bp-usage-indicator[data-placement='header'] { flex: 0 0 auto; margin: 0 8px 0 0; }

.bp-usage-indicator[data-placement='dock'] {
  position: fixed;
  z-index: 2147483000;
  margin: 0;
  padding: 4px;
  border: 1px solid var(--bp-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--bp-bg) 88%, transparent);
  box-shadow: 0 8px 24px -8px rgb(0 0 0 / 35%), 0 1px 2px rgb(0 0 0 / 12%);
  backdrop-filter: blur(10px);
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.bp-usage-indicator[data-placement='dock']:active { cursor: grabbing; }
.bp-usage-indicator[data-placement='dock'] .bp-usage-trigger { border-color: transparent; background: transparent; box-shadow: none; }

.bp-usage-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--bp-border);
  border-radius: 8px;
  background: var(--bp-bg);
  color: var(--bp-fg);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 1px 2px rgb(0 0 0 / 5%);
  transition: background 120ms ease, border-color 120ms ease;
}
.bp-usage-trigger:hover { background: var(--bp-accent); }
.bp-usage-trigger:focus-visible { outline: 2px solid var(--bp-fg); outline-offset: 2px; }

.bp-usage-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--bp-dot);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--bp-dot) 22%, transparent);
}
.bp-usage-count { font-weight: 600; font-variant-numeric: tabular-nums; }
.bp-usage-unit { margin-left: -3px; color: var(--bp-muted); font-weight: 400; }
.bp-usage-meter { width: 28px; height: 4px; flex-shrink: 0; overflow: hidden; border-radius: 999px; background: var(--bp-border); }
.bp-usage-meter[hidden] { display: none; }
.bp-usage-meter-fill { height: 100%; border-radius: inherit; background: var(--bp-dot); transition: width 240ms ease; }
.bp-usage-mode { max-width: 16ch; padding-left: 8px; overflow: hidden; border-left: 1px solid var(--bp-border); color: var(--bp-muted); font-weight: 400; text-overflow: ellipsis; }
.bp-usage-mode[hidden] { display: none; }

@media (max-width: 520px) {
  .bp-usage-mode, .bp-usage-unit { display: none; }
}

.bp-tooltip .bp-tip-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.bp-tooltip .bp-tip-mode { font-size: 13px; font-weight: 600; }
.bp-tooltip .bp-tip-count { margin: 6px 0 8px; font-size: 24px; font-weight: 650; letter-spacing: -.04em; line-height: 1.1; }
.bp-tooltip .bp-tip-total { color: var(--bp-muted); font-size: 12px; font-weight: 400; letter-spacing: 0; }
.bp-tooltip .bp-tip-sub { margin-top: 8px; color: var(--bp-muted); font-size: 11px; }
.bp-tooltip .bp-tip-divider { height: 1px; margin: 10px 0; background: var(--bp-border); }
.bp-tooltip .bp-tip-row { display: flex; justify-content: space-between; gap: 16px; padding: 2px 0; }
.bp-tooltip .bp-tip-row.active { font-weight: 600; }
.bp-tooltip .bp-tip-label { color: var(--bp-muted); }
.bp-tooltip .bp-tip-row.active .bp-tip-label { color: var(--bp-fg); }
.bp-tooltip .bp-tip-foot { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--bp-border); color: var(--bp-muted); font-size: 10px; }

.bp-usage-dialog .bp-hero { padding: 16px; border: 1px solid var(--bp-border); border-radius: 12px; background: var(--bp-accent); }
.bp-usage-dialog .bp-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.bp-usage-dialog .bp-hero-title { display: flex; flex-direction: column; }
.bp-usage-dialog .bp-hero-label { color: var(--bp-muted); font-size: 11px; }
.bp-usage-dialog .bp-hero-mode { font-size: 15px; font-weight: 600; }
.bp-usage-dialog .bp-hero-count { margin: 10px 0 12px; font-size: 34px; font-weight: 650; letter-spacing: -.04em; line-height: 1; }
.bp-usage-dialog .bp-hero-total { color: var(--bp-muted); font-size: 14px; font-weight: 400; letter-spacing: 0; }
.bp-usage-dialog .bp-hero-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 12px; color: var(--bp-muted); font-size: 11px; }

.bp-timer-block { margin-top: 10px; }
.bp-timer-block .bp-progress { height: 3px; margin-bottom: 6px; }
.bp-timer-text { color: var(--bp-muted); font-size: 11px; }

.bp-usage-dialog .bp-usage-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.bp-usage-dialog .bp-card { min-width: 0; padding: 13px; border: 1px solid var(--bp-border); border-radius: 12px; background: var(--bp-bg); }
.bp-usage-dialog .bp-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.bp-usage-dialog .bp-card-name { overflow: hidden; color: var(--bp-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.bp-usage-dialog .bp-card-count { font-size: 22px; font-weight: 650; letter-spacing: -.04em; }
.bp-usage-dialog .bp-card-total { color: var(--bp-muted); font-size: 11px; font-weight: 400; letter-spacing: 0; }
.bp-usage-dialog .bp-card-period { margin: 2px 0 10px; color: var(--bp-muted); font-size: 10px; }

.bp-usage-dialog .bp-dot { width: 7px; height: 7px; flex-shrink: 0; border-radius: 50%; background: var(--bp-muted); }
.bp-usage-dialog .bp-dot.healthy { background: var(--bp-green); }
.bp-usage-dialog .bp-dot.low, .bp-usage-dialog .bp-dot.critical { background: var(--bp-yellow); }
.bp-usage-dialog .bp-dot.empty { background: var(--bp-red); }

.bp-usage-dialog .bp-details { margin-bottom: 8px; border: 1px solid var(--bp-border); border-radius: 12px; }
.bp-usage-dialog .bp-details-summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 14px; cursor: pointer; font-weight: 600; list-style: none; }
.bp-usage-dialog .bp-details-summary::-webkit-details-marker { display: none; }
.bp-usage-dialog .bp-details-summary::after { content: '▾'; color: var(--bp-muted); transition: transform 140ms ease; }
.bp-usage-dialog .bp-details[open] > .bp-details-summary::after { transform: rotate(180deg); }
.bp-usage-dialog .bp-details-title { flex: 1; }
.bp-usage-dialog .bp-details-count { color: var(--bp-muted); font-size: 11px; font-weight: 400; }
.bp-usage-dialog .bp-details > .bp-data-list,
.bp-usage-dialog .bp-details > .bp-empty { margin: 0 12px 12px; }
.bp-usage-dialog .bp-updated { margin-right: auto; color: var(--bp-muted); font-size: 11px; }

@media (max-width: 520px) {
  .bp-usage-dialog .bp-usage-grid { grid-template-columns: 1fr; }
}

.bp-notice {
  margin-bottom: 16px;
  padding: 11px 12px;
  border: 1px solid hsl(38 92% 50% / 35%);
  border-radius: 10px;
  background: hsl(38 92% 50% / 10%);
  color: var(--bp-fg);
  font-size: 12px;
}

.bp-tooltip .bp-tip-notice {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: hsl(38 92% 50% / 12%);
  color: var(--bp-fg);
  font-size: 11px;
}

.bp-usage-dialog .bp-raw {
  max-height: 260px;
  margin: 0 12px 12px;
  padding: 10px 12px;
  overflow: auto;
  border-radius: 8px;
  background: var(--bp-accent);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
}

.bp-badge.reported { color: var(--bp-muted); background: var(--bp-accent); }
.bp-dot.reported { background: var(--bp-muted); }
`

export const ensureUsageStyles = (): void => injectStyle('better-perplexity-usage-styles', USAGE_CSS)
