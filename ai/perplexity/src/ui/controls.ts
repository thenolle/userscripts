import { createElement } from '@nolly/core'

export interface ButtonOptions {
  primary?: boolean
  onClick?: (event: MouseEvent) => void
}

export interface SwitchOptions {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export interface NumberFieldOptions {
  label: string
  hint?: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}

export const createButton = (label: string, { primary = false, onClick }: ButtonOptions = {}): HTMLButtonElement => {
  const button = createElement('button', primary ? 'bp-button bp-button-primary' : 'bp-button', label)
  button.type = 'button'
  if (onClick) button.addEventListener('click', onClick)
  return button
}

export const createSwitch = ({ label, hint, checked, onChange }: SwitchOptions): { wrapper: HTMLLabelElement; input: HTMLInputElement } => {
  const wrapper = createElement('label', 'bp-switch')
  const text = createElement('span', 'bp-switch-text')
  text.appendChild(createElement('span', undefined, label))
  if (hint) text.appendChild(createElement('span', 'bp-data-label', hint))
  const input = createElement('input')
  input.type = 'checkbox'
  input.checked = checked
  input.addEventListener('change', () => onChange(input.checked))
  wrapper.append(text, input, createElement('span', 'bp-switch-track'))
  return { wrapper, input }
}

export const createSection = (title: string, aside?: string): HTMLElement => {
  const section = createElement('section', 'bp-section')
  const heading = createElement('h3', 'bp-section-heading')
  heading.appendChild(createElement('span', undefined, title))
  if (aside !== undefined) heading.appendChild(createElement('span', undefined, aside))
  section.appendChild(heading)
  return section
}

export const createDataRow = (label: string, value: string, className = ''): HTMLElement => {
  const row = createElement('div', 'bp-data-row')
  row.append(createElement('span', 'bp-data-label', label), createElement('span', `bp-data-value ${className}`.trim(), value))
  return row
}

export const createNumberField = ({ label, hint, value, min, max, step = 1, onChange }: NumberFieldOptions): { wrapper: HTMLLabelElement; input: HTMLInputElement } => {
  const wrapper = createElement('label', 'bp-field')
  const text = createElement('span', 'bp-switch-text')
  text.appendChild(createElement('span', undefined, label))
  if (hint) text.appendChild(createElement('span', 'bp-data-label', hint))
  const input = createElement('input', 'bp-input')
  input.type = 'number'
  input.value = String(value)
  input.step = String(step)
  if (min !== undefined) input.min = String(min)
  if (max !== undefined) input.max = String(max)
  input.addEventListener('change', () => {
    const parsed = Number(input.value)
    if (!Number.isFinite(parsed)) return
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed))
    input.value = String(clamped)
    onChange(clamped)
  })
  wrapper.append(text, input)
  return { wrapper, input }
}

export const createSelectField = <T extends string>(label: string, options: readonly { value: T; label: string }[], value: T, onChange: (value: T) => void): HTMLLabelElement => {
  const wrapper = createElement('label', 'bp-field')
  wrapper.appendChild(createElement('span', undefined, label))
  const select = createElement('select', 'bp-input')
  for (const option of options) {
    const element = createElement('option', undefined, option.label)
    element.value = option.value
    select.appendChild(element)
  }
  select.value = value
  select.addEventListener('change', () => onChange(select.value as T))
  wrapper.appendChild(select)
  return wrapper
}

export const createTextArea = (placeholder: string, value: string, onInput: (value: string) => void): HTMLTextAreaElement => {
  const area = createElement('textarea', 'bp-input')
  area.placeholder = placeholder
  area.value = value
  area.rows = 3
  area.addEventListener('input', () => onInput(area.value))
  return area
}