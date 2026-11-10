import { injectStyle } from '@nolly/core'

const CSS = `
.bp-config-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
}

.bp-config-button svg { pointer-events: none; }
`

export const ensureConfigButtonStyles = (): void => injectStyle('better-perplexity-enter-styles', CSS)