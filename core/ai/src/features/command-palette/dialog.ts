import { createElement } from '@nolly/core'
import { createButton } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'
import { DEFAULT_SHORTCUT, formatShortcut, shortcutFromEvent, type Shortcut } from './shortcut'
import { ensurePaletteStyles } from './styles'
import { uiConfig } from '../../ui/config'

const DIALOG_ID() = `${uiConfig().id}-shortcut-dialog`

export const toggleShortcutDialog = (current: Shortcut, onSave: (shortcut: Shortcut) => void, title = 'Palette shortcut', defaults: Shortcut = DEFAULT_SHORTCUT): void => {
  const existing = document.getElementById(DIALOG_ID())
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  ensurePaletteStyles()
  const ui = createDialog({ id: DIALOG_ID(), title, description: 'Use at least one of Ctrl, Alt or Meta.', width: 420 })
  let draft: Shortcut = { ...current }
  let recording = false
  const box = createElement('div', 'bp-shortcut-box', formatShortcut(draft))
  const record = createButton('Record new shortcut')
  const stopRecording = (): void => {
    recording = false
    record.textContent = 'Record new shortcut'
    box.textContent = formatShortcut(draft)
  }
  record.addEventListener('click', () => {
    recording = true
    record.textContent = 'Press the shortcut…'
    box.textContent = '…'
  })
  ui.dialog.addEventListener('keydown', (event) => {
    if (!recording) return
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') {
      stopRecording()
      return
    }
    const captured = shortcutFromEvent(event)
    if (!captured) return
    draft = captured
    stopRecording()
  }, true)
  ui.body.append(box)
  ui.footer.append(
    record,
    createButton('Reset', {
      onClick: () => {
        draft = { ...defaults }
        stopRecording()
      }
    }),
    createButton('Save', {
      primary: true,
      onClick: () => {
        onSave(draft)
        ui.close()
      }
    })
  )
  ui.show()
}
