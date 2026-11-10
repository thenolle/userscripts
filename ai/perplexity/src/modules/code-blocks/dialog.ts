import { createElement } from '@nolly/core'
import { createButton, createNumberField, createSelectField, createSwitch, createDialog } from '@nolly/ai'
import { DEFAULT_CODE_SETTINGS, type CodeBlockSettings } from './settings'

const DIALOG_ID = 'better-perplexity-code-dialog'

export const toggleCodeSettingsDialog = (current: CodeBlockSettings, onSave: (settings: CodeBlockSettings) => void): void => {
  const existing = document.getElementById(DIALOG_ID)
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  const ui = createDialog({ id: DIALOG_ID, title: 'Code Block Pro', description: 'Applies to code blocks as soon as an answer finishes.', width: 460 })
  const draft: CodeBlockSettings = { ...current }
  const stack = createElement('div', 'bp-stack')
  stack.append(
    createSwitch({ label: 'Wrap long lines', checked: draft.wrap, onChange: (value) => (draft.wrap = value) }).wrapper,
    createSwitch({ label: 'Show line numbers', checked: draft.lineNumbers, onChange: (value) => (draft.lineNumbers = value) }).wrapper,
    createSwitch({ label: 'Hide the site’s own block header', checked: draft.hideSiteChrome, onChange: (value) => (draft.hideSiteChrome = value) }).wrapper,
    createSelectField('Syntax colours', [
      { value: 'builtin', label: 'Built-in (recommended)' },
      { value: 'site', label: 'Site’s own' },
      { value: 'plain', label: 'None' }
    ], draft.highlight, (value) => (draft.highlight = value)),
    createNumberField({ label: 'Fold after N lines', hint: '0 never folds', value: draft.collapseAfter, min: 0, max: 1000, onChange: (value) => (draft.collapseAfter = value) }).wrapper
  )
  ui.body.appendChild(stack)
  const save = (): void => {
    onSave({ ...draft })
    ui.close()
  }
  const reset = (): void => {
    ui.close()
    toggleCodeSettingsDialog({ ...DEFAULT_CODE_SETTINGS }, onSave)
  }
  ui.footer.append(createButton('Cancel', { onClick: ui.close }), createButton('Reset', { onClick: reset }), createButton('Save', { primary: true, onClick: save }))
  ui.show()
}