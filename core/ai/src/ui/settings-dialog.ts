import { createElement } from '@nolly/core'
import type { ScriptContext } from '@nolly/core'
import { uiConfig } from './config'
import { createButton, createSwitch } from './controls'
import { createDialog } from './dialog'

type SettingsHost = Pick<ScriptContext, 'getFeatures' | 'runCommand'>

export const toggleSettingsDialog = (host: SettingsHost): void => {
  const { id, title, version } = uiConfig()
  const dialogId = `${id}-settings-dialog`
  const existing = document.getElementById(dialogId)
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  const ui = createDialog({ id: dialogId, title, description: `Version ${version}`, width: 560 })
  const render = (): void => {
    ui.body.replaceChildren(
      ...host.getFeatures().map((feature) => {
        const section = createElement('section', 'bp-section')
        section.appendChild(
          createSwitch({
            label: feature.name,
            hint: feature.description,
            checked: feature.enabled,
            onChange: () => {
              feature.toggle()
              render()
            }
          }).wrapper
        )
        if (feature.enabled) {
          const actions = createElement('div', 'bp-actions')
          for (const entry of feature.menuEntries()) {
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
        window.setTimeout(() => host.runCommand('command-palette:open'), 0)
      }
    }),
    createButton('Close', { primary: true, onClick: ui.close })
  )
  ui.show()
}
