import { injectStyle } from '../core/styles'
import { CONTROLS_CSS } from './css/controls'
import { DIALOG_CSS } from './css/dialog'
import { THEME_CSS } from './css/theme'
import { TOOLTIP_CSS } from './css/tooltip'

export const ensureUiStyles = (): void => {
  injectStyle('better-perplexity-ui-base', [THEME_CSS, DIALOG_CSS, CONTROLS_CSS, TOOLTIP_CSS].join('\n'))
}