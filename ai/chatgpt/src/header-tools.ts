import { findHeaderSlot } from './locate'

const ORDER = ['settings', 'usage', 'export', 'help'] as const

export type ToolId = (typeof ORDER)[number]

export const toolRow = (): HTMLElement | null => {
  const slot = findHeaderSlot()
  return slot?.querySelector<HTMLElement>('.contents > div') ?? slot
}

export const placeTool = (button: HTMLElement, id: ToolId): boolean => {
  const row = toolRow()
  if (!row) return false
  button.dataset['bcTool'] = id
  if (button.parentElement !== row) row.append(button)
  const ours = ORDER.flatMap((name) => row.querySelector<HTMLElement>(`:scope > [data-bc-tool="${name}"]`) ?? [])
  let cursor: Element | null = [...row.children].filter((child) => !child.hasAttribute('data-bc-tool')).at(-1) ?? null
  for (const element of ours) {
    const wanted: Element | null = cursor ? cursor.nextElementSibling : row.firstElementChild
    if (wanted !== element) row.insertBefore(element, wanted)
    cursor = element
  }
  return true
}
