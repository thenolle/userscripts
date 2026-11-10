import { createElement, type Feature } from '@nolly/core'
import { uiConfig } from './config'
import { createButton, createSection, createSwitch } from './controls'
import { createDialog } from './dialog'

export const toggleSettingsDialog = (modules: readonly Feature[], onChange: () => void): void => {
  const { id, title, version } = uiConfig()
  const dialogId = `${id}-settings-dialog`
  const existing = document.getElementById(dialogId)
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  const ui = createDialog({ id: dialogId, title, description: `Version ${version}`, width: 480 })
  const render = (): void => {
    const sections = modules.map((module) => {
      const section = createSection(module.name)
      const stack = createElement('div', 'bp-stack')
      const toggle = createSwitch({
        label: 'Enabled',
        hint: module.description,
        checked: module.enabled,
        onChange: (checked) => {
          module.enabled = checked
          onChange()
        }
      })
      stack.appendChild(toggle.wrapper)
      for (const entry of module.menuEntries()) {
        stack.appendChild(
          createButton(entry.label, {
            onClick: () => {
              entry.action()
              render()
            }
          })
        )
      }
      section.appendChild(stack)
      return section
    })
    ui.body.replaceChildren(...sections)
  }
  render()
  ui.footer.append(createButton('Done', { primary: true, onClick: ui.close }))
  ui.show()
}
