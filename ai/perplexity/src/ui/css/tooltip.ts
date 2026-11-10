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