import { createElement } from '@nolly/core'
import { createButton, createSelectField, createSwitch } from '@nolly/ai'
import { createDialog } from '@nolly/ai'
import type { CitationStyle } from './citations'
import { runExport } from './service'
import type { ExportFormat, ExportSettings } from './settings'

const DIALOG_ID = 'better-perplexity-export-dialog'

const FORMATS: readonly { value: ExportFormat; label: string }[] = [
  { value: 'md', label: 'Markdown (.md), formatted' },
  { value: 'txt', label: 'Plain text (.txt)' },
  { value: 'docx', label: 'Word (.docx), generated here' },
  { value: 'pdf', label: 'PDF, generated here' },
  { value: 'json', label: 'Raw thread JSON' }
]

const STYLES: readonly { value: CitationStyle; label: string }[] = [
  { value: 'parenthesized', label: 'Parenthesized: ([1](url))' },
  { value: 'inline', label: 'Inline links: [1](url)' },
  { value: 'named', label: 'Named: ([domain](url))' },
  { value: 'endnotes', label: 'Numbered with a Sources list' },
  { value: 'footnotes', label: 'Markdown footnotes' },
  { value: 'none', label: 'No citations' }
]

export const toggleExportDialog = (settings: ExportSettings, onSettings: (settings: ExportSettings) => void): void => {
  const existing = document.getElementById(DIALOG_ID)
  if (existing instanceof HTMLDialogElement) {
    existing.close()
    return
  }
  const ui = createDialog({ id: DIALOG_ID, title: 'Export thread', description: 'Exports the thread you are viewing.', width: 480 })
  const state: ExportSettings = { ...settings }
  const status = createElement('div', 'bp-hint')
  const styleField = createSelectField('Citations', STYLES, state.style, (value) => update({ style: value }))
  const logoField = createSwitch({ label: 'Remove the Perplexity logo line', checked: state.stripLogo, onChange: (value) => update({ stripLogo: value }) }).wrapper
  const copyButton = createButton('Copy')
  const downloadButton = createButton('Download', { primary: true })
  const render = (): void => {
    const rendered = state.format !== 'json'
    styleField.hidden = !rendered
    logoField.hidden = !rendered
    copyButton.hidden = !(state.format === 'md' || state.format === 'txt' || state.format === 'json')
  }
  const update = (patch: Partial<ExportSettings>): void => {
    Object.assign(state, patch)
    onSettings({ ...state })
    render()
  }
  const run = async (action: 'download' | 'copy'): Promise<void> => {
    copyButton.disabled = true
    downloadButton.disabled = true
    status.textContent = 'Working…'
    try {
      status.textContent = await runExport(state, action)
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Export failed.'
    } finally {
      copyButton.disabled = false
      downloadButton.disabled = false
    }
  }
  copyButton.addEventListener('click', () => void run('copy'))
  downloadButton.addEventListener('click', () => void run('download'))
  const stack = createElement('div', 'bp-stack')
  stack.append(createSelectField('Format', FORMATS, state.format, (value) => update({ format: value })), styleField, logoField, status)
  ui.body.appendChild(stack)
  ui.footer.append(createButton('Close', { onClick: ui.close }), copyButton, downloadButton)
  render()
  ui.show()
}