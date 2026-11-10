import { findHeaderSlot } from './locate'

const ORDER = ['settings', 'usage', 'export'] as const

export type ToolId = (typeof ORDER)[number]

export const toolRow = (): HTMLElement | null => {
  const slot = findHeaderSlot()
  return slot?.querySelector<HTMLElement>('.contents > div') ?? slot
}

export const placeTool = (button: HTMLElement, id: ToolId): boolean => {
  const row = toolRow()
  if (!row) return false
  button.dataset['bcTool'] = id
  if (button.parentElement !== row) row.prepend(button)
  const ours = ORDER.flatMap((name) => row.querySelector<HTMLElement>(`:scope > [data-bc-tool="${name}"]`) ?? [])
  ours.forEach((element, index) => {
    const expected = row.children[index] ?? null
    if (expected !== element) row.insertBefore(element, expected)
  })
  return true
}
