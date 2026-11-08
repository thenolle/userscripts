import { createElement } from '../core/dom'
import type { FeatureModule } from '../core/module'
import { createButton, createSection, createSwitch } from './controls'
import { createDialog } from './dialog'

const DIALOG_ID = 'better-perplexity-settings-dialog'

export const toggleSettingsDialog = (modules: readonly FeatureModule[], onChange: () => void): void => {
  const existing = document.getElementById(DIALOG_ID)
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  const ui = createDialog({ id: DIALOG_ID, title: 'Better Perplexity', description: `Version ${__VERSION__}`, width: 480 })
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