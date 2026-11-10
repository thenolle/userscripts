import { injectStyle } from '@nolly/core'
import { uiConfig } from './config'
import { CONTROLS_CSS, DIALOG_CSS, THEME_CSS, TOOLTIP_CSS } from './css'

export const ensureUiStyles = (): void => {
  injectStyle(`${uiConfig().id}-ui-base`, [THEME_CSS, DIALOG_CSS, CONTROLS_CSS, TOOLTIP_CSS].join('\n'))
}
