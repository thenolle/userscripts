export const DIALOG_CSS = `
.bp-dialog {
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