export const SELECTORS = {
  composerForm: 'form:has(fieldset)',
  editable: '[contenteditable="true"], textarea',
  codeSurface: '[data-code-block], .cm-editor',
  attach: '[data-composer-navigation-target="add-context"]',
  modeToggle: 'button[aria-pressed]',
  headerSlot: '[data-app-shell-header-obstacle="true"]',
  sidebar: 'aside',
  sidebarNav: 'aside nav',
  codeBlock: '[data-code-block="true"]',
  codeControls: '[data-code-block-controls]',
  codeSource: '[data-chatgpt-copy-code]'
} as const

export const STOP_LABEL = /\b(stop|arr[eê]t\w*|stopp\w*|detener|parar)\b/i
export const STOP_TEST_ID = /stop/i
