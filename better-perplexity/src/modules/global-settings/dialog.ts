import { createElement } from '../../core/dom'
import type { AppContext } from '../../core/module'
import { createButton, createSwitch } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import { ensureGearStyles } from './styles'

const DIALOG_ID = 'better-perplexity-settings-dialog'

export const toggleGlobalSettings = (context: AppContext): void => {
  const existing = document.getElementById(DIALOG_ID)
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  ensureGearStyles()
  const ui = createDialog({ id: DIALOG_ID, title: 'Better Perplexity', description: `Version ${__VERSION__}`, width: 560 })
  const render = (): void => {
    ui.body.replaceChildren(
      ...context.getModules().map((module) => {
        const section = createElement('section', 'bp-section')
        section.appendChild(
          createSwitch({
            label: module.name,
            hint: module.description,
            checked: module.enabled,
            onChange: () => {
              module.toggle()
              render()
            }
          }).wrapper
        )
        if (module.enabled) {
          const actions = createElement('div', 'bp-actions')
          for (const entry of module.menuEntries()) {
            actions.appendChild(
              createButton(entry.label, {
                onClick: () => {
                  ui.close()
                  window.setTimeout(entry.action, 0)
                }
              })
            )
          }
          if (actions.childElementCount) section.appendChild(actions)
        }
        return section
      })
    )
  }
  render()
  ui.footer.append(
    createButton('Command palette', {
      onClick: () => {
        ui.close()
        window.setTimeout(() => context.runCommand('command-palette:open'), 0)
      }
    }),
    createButton('Close', { primary: true, onClick: ui.close })
  )
  ui.show()
}