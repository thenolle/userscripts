import { createElement } from '@nolly/core'
import type { Logger } from '@nolly/core'
import { createButton, createSwitch } from '../../ui/controls'
import { uiConfig } from '../../ui/config'
import { createDialog } from '../../ui/dialog'
import { DEFAULT_SHORTCUTS, SHORTCUT_OPTIONS, describeShortcuts } from './shortcuts'
import type { Modifier, ShortcutSettings } from './shortcuts'

export const toggleShortcutsDialog = (current: ShortcutSettings, onSave: (settings: ShortcutSettings) => void, logger: Logger): void => {
  const dialogId = `${uiConfig().id}-enter-dialog`
  const existing = document.getElementById(dialogId)
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  const ui = createDialog({ id: dialogId, title: 'Enter as Newline', description: 'Choose which keyboard shortcuts send your message.', width: 440 })
  const draft: ShortcutSettings = { ...current }
  const summary = createElement('p', 'bp-hint', describeShortcuts(draft))
  const stack = createElement('div', 'bp-stack')
  const inputs = new Map<Modifier, HTMLInputElement>()
  for (const { key, label } of SHORTCUT_OPTIONS) {
    const { wrapper, input } = createSwitch({
      label,
      checked: draft[key],
      onChange: (checked) => {
        draft[key] = checked
        summary.textContent = describeShortcuts(draft)
      }
    })
    inputs.set(key, input)
    stack.appendChild(wrapper)
  }
  ui.body.append(stack, summary)
  const reset = (): void => {
    for (const [key, input] of inputs) {
      draft[key] = DEFAULT_SHORTCUTS[key]
      input.checked = DEFAULT_SHORTCUTS[key]
    }
    summary.textContent = describeShortcuts(draft)
  }
  const save = (): void => {
    onSave({ ...draft })
    logger.success('Send shortcuts saved.', draft)
    ui.close()
  }
  ui.footer.append(createButton('Cancel', { onClick: ui.close }), createButton('Reset', { onClick: reset }), createButton('Save', { primary: true, onClick: save }))
  ui.show()
}
