import { createElement, injectStyle } from '@nolly/core'
import { markUi, uiConfig } from './config'
import { createButton } from './controls'
import { ensureUiStyles } from './styles'

export interface ToastAction {
  label: string
  primary?: boolean
  keepOpen?: boolean
  onClick: () => void
}

const CSS = `
.bp-toast { position: fixed; right: 20px; bottom: 20px; z-index: 100001; display: flex; flex-direction: column; gap: 10px; width: 320px; padding: 14px 16px; border: 1px solid var(--bp-border); border-radius: 12px; background: var(--bp-bg); color: var(--bp-fg); box-shadow: 0 12px 32px rgb(0 0 0 / 22%); font: 13px/1.45 ui-sans-serif, system-ui, sans-serif; }
.bp-toast-actions { display: flex; flex-wrap: wrap; gap: 6px; }
`

export const showToast = (message: string, actions: readonly ToastAction[] = [], duration = 8_000): (() => void) => {
  ensureUiStyles()
  injectStyle(`${uiConfig().id}-toast-styles`, CSS)
  const toast = markUi(createElement('div', 'bp-toast bp-themed'))
  const dismiss = (): void => toast.remove()
  toast.appendChild(createElement('div', undefined, message))
  if (actions.length) {
    const row = createElement('div', 'bp-toast-actions')
    for (const action of actions) {
      row.appendChild(
        createButton(action.label, {
          primary: action.primary,
          onClick: () => {
            if (!action.keepOpen) dismiss()
            action.onClick()
          }
        })
      )
    }
    toast.appendChild(row)
  }
  document.body.appendChild(toast)
  if (duration > 0) window.setTimeout(dismiss, duration)
  return dismiss
}
