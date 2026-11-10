import { injectStyle } from '@nolly/core'
import { uiConfig } from '../../ui/config'

const CSS = `
.bp-prompt-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; border: 1px solid var(--bp-border); border-radius: 10px; }
.bp-prompt-main { min-width: 0; }
.bp-prompt-actions { display: flex; flex-shrink: 0; gap: 6px; }
`

export const ensureSlashStyles = (): void => injectStyle(`${uiConfig().id}-slash-styles`, CSS)