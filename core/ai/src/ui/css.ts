export const THEME_CSS = `
.bp-themed {
  --bp-bg: hsl(0 0% 100%);
  --bp-fg: hsl(240 10% 3.9%);
  --bp-muted: hsl(240 3.8% 46.1%);
  --bp-border: hsl(240 5.9% 90%);
  --bp-accent: hsl(240 4.8% 95.9%);
  --bp-track: hsl(240 5% 78%);
  --bp-ring: hsl(240 5% 64.9%);
  --bp-green: hsl(142 71% 40%);
  --bp-yellow: hsl(38 92% 45%);
  --bp-red: hsl(0 84% 55%);
}

@media (prefers-color-scheme: dark) {
  .bp-themed {
    --bp-bg: hsl(240 10% 5%);
    --bp-fg: hsl(0 0% 98%);
    --bp-muted: hsl(240 5% 64.9%);
    --bp-border: hsl(240 3.7% 17%);
    --bp-accent: hsl(240 3.7% 13%);
    --bp-track: hsl(240 3.7% 28%);
    --bp-green: hsl(142 71% 45%);
    --bp-yellow: hsl(38 92% 50%);
    --bp-red: hsl(0 84% 60%);
  }
}
`

export const DIALOG_CSS = `
.bp-dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  height: fit-content;
  width: min(var(--bp-width, 560px), calc(100vw - 32px));
  max-width: none;
  max-height: min(86vh, 820px);
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--bp-border);
  border-radius: 14px;
  background: var(--bp-bg);
  color: var(--bp-fg);
  box-shadow: 0 24px 60px -12px rgb(0 0 0 / 35%);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
}

.bp-dialog[open] { display: flex; flex-direction: column; animation: bp-dialog-in 160ms ease-out; }
.bp-dialog::backdrop { background: rgb(0 0 0 / 55%); backdrop-filter: blur(6px); animation: bp-fade-in 160ms ease-out; }
.bp-dialog *, .bp-dialog *::before, .bp-dialog *::after { box-sizing: border-box; }

@keyframes bp-dialog-in { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes bp-fade-in { from { opacity: 0; } to { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .bp-dialog[open], .bp-dialog::backdrop { animation: none; }
}

.bp-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--bp-border);
}

.bp-dialog-title { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -.02em; }
.bp-dialog-description { margin: 3px 0 0; color: var(--bp-muted); font-size: 12px; }
.bp-dialog-body { flex: 1; min-height: 0; padding: 16px 20px; overflow-y: auto; overscroll-behavior: contain; }

.bp-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--bp-border);
}

.bp-dialog-footer:empty { display: none; }

.bp-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--bp-muted);
  font: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.bp-icon-button:hover { background: var(--bp-accent); color: var(--bp-fg); }

@media (max-width: 520px) {
  .bp-dialog-header, .bp-dialog-body, .bp-dialog-footer { padding-right: 14px; padding-left: 14px; }
}
`

export const CONTROLS_CSS = `
.bp-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--bp-border);
  border-radius: 8px;
  background: transparent;
  color: var(--bp-fg);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, opacity 120ms ease;
}

.bp-button:hover:not(:disabled) { background: var(--bp-accent); }
.bp-button:disabled { opacity: .55; cursor: progress; }
.bp-button-primary { border-color: var(--bp-fg); background: var(--bp-fg); color: var(--bp-bg); }
.bp-button-primary:hover:not(:disabled) { background: var(--bp-fg); opacity: .88; }

.bp-dialog button:focus-visible,
.bp-dialog summary:focus-visible { outline: 2px solid var(--bp-ring); outline-offset: 2px; }

.bp-stack { display: flex; flex-direction: column; gap: 8px; }
.bp-section { margin-bottom: 20px; }
.bp-section:last-child { margin-bottom: 0; }

.bp-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 10px;
  color: var(--bp-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.bp-hint { margin: 12px 0 0; color: var(--bp-muted); font-size: 12px; }
.bp-actions { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 2px; }

.bp-switch {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 12px;
  border: 1px solid var(--bp-border);
  border-radius: 10px;
  cursor: pointer;
  transition: background 120ms ease;
}

.bp-switch:hover { background: var(--bp-accent); }
.bp-switch-text { display: flex; flex-direction: column; min-width: 0; }
.bp-switch input { position: absolute; opacity: 0; pointer-events: none; }

.bp-switch-track {
  position: relative;
  flex-shrink: 0;
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: var(--bp-track);
  transition: background 140ms ease;
}

.bp-switch-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bp-bg);
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
  transition: transform 140ms ease;
}

.bp-switch input:checked + .bp-switch-track { background: var(--bp-fg); }
.bp-switch input:checked + .bp-switch-track::after { transform: translateX(14px); }
.bp-switch input:focus-visible + .bp-switch-track { outline: 2px solid var(--bp-ring); outline-offset: 2px; }

.bp-data-list { overflow: hidden; border: 1px solid var(--bp-border); border-radius: 10px; }

.bp-data-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 34px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--bp-border);
}

.bp-data-row:last-child { border-bottom: 0; }
.bp-data-label { color: var(--bp-muted); }
.bp-data-value { overflow-wrap: anywhere; font-weight: 500; text-align: right; }
.bp-data-value.positive { color: var(--bp-green); }
.bp-data-value.negative { color: var(--bp-red); }

.bp-empty { padding: 14px; border: 1px dashed var(--bp-border); border-radius: 10px; color: var(--bp-muted); text-align: center; }

.bp-error {
  padding: 11px 12px;
  border: 1px solid hsl(0 84% 60% / 30%);
  border-radius: 10px;
  background: hsl(0 84% 60% / 8%);
  color: var(--bp-red);
}

.bp-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--bp-accent);
  color: var(--bp-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .02em;
  white-space: nowrap;
}

.bp-badge.healthy { background: hsl(142 71% 45% / 14%); color: var(--bp-green); }
.bp-badge.low { background: hsl(38 92% 50% / 16%); color: var(--bp-yellow); }
.bp-badge.critical, .bp-badge.empty { background: hsl(0 84% 60% / 14%); color: var(--bp-red); }

.bp-progress { height: 5px; overflow: hidden; border-radius: 99px; background: var(--bp-accent); }
.bp-progress-fill { width: 0; height: 100%; border-radius: inherit; background: var(--bp-green); transition: width 400ms ease; }
.bp-progress-fill.low { background: var(--bp-yellow); }
.bp-progress-fill.critical, .bp-progress-fill.empty { background: var(--bp-red); }
.bp-progress-fill.timer { background: var(--bp-muted); transition: width 900ms linear; }

.bp-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 12px;
  border: 1px solid var(--bp-border);
  border-radius: 10px;
}

.bp-input {
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid var(--bp-border);
  border-radius: 8px;
  background: var(--bp-bg);
  color: var(--bp-fg);
  font: inherit;
  font-size: 12px;
}

.bp-input:focus-visible { outline: 2px solid var(--bp-ring); outline-offset: 1px; }
input.bp-input[type='number'] { width: 96px; text-align: right; }
textarea.bp-input { width: 100%; min-height: 64px; resize: vertical; font-family: ui-monospace, monospace; }

.bp-header-btn {
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

.bp-header-btn:hover { background: var(--bp-accent); }
.bp-header-btn:focus-visible { outline: 2px solid var(--bp-fg); outline-offset: 2px; }
`

export const TOOLTIP_CSS = `
.bp-tooltip {
  position: fixed;
  inset: auto;
  width: max-content;
  max-width: min(300px, calc(100vw - 16px));
  margin: 0;
  padding: 0;
  overflow: visible;
  border: 1px solid var(--bp-border);
  border-radius: 12px;
  background: var(--bp-bg);
  color: var(--bp-fg);
  box-shadow: 0 12px 32px rgb(0 0 0 / 22%);
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  pointer-events: none;
}

.bp-tooltip:popover-open { animation: bp-tooltip-in 120ms ease-out; }
.bp-tooltip *, .bp-tooltip *::before, .bp-tooltip *::after { box-sizing: border-box; }
.bp-tooltip-body { padding: 12px 14px; }

@keyframes bp-tooltip-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .bp-tooltip:popover-open { animation: none; }
}
`
