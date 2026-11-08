import { injectStyle } from '../../core/styles'

const CSS = `
.bp-palette { max-height: min(70vh, 480px); }
.bp-palette .bp-dialog-header,
.bp-palette .bp-dialog-footer { display: none; }
.bp-palette .bp-dialog-body { padding: 0; }

.bp-palette-input {
  width: 100%;
  padding: 16px 18px;
  border: 0;
  border-bottom: 1px solid var(--bp-border);
  outline: 0;
  background: transparent;
  color: var(--bp-fg);
  font: inherit;
  font-size: 15px;
}

.bp-palette-list { max-height: 360px; overflow-y: auto; padding: 6px; }

.bp-palette-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.bp-palette-item[aria-selected='true'] { background: var(--bp-accent); }
.bp-palette-group { color: var(--bp-muted); font-size: 11px; }
.bp-palette-empty { padding: 18px; color: var(--bp-muted); text-align: center; }
.bp-shortcut-box { padding: 14px; border: 1px dashed var(--bp-border); border-radius: 10px; font-size: 15px; font-weight: 600; text-align: center; }
`

export const ensurePaletteStyles = (): void => injectStyle('better-perplexity-palette-styles', CSS)