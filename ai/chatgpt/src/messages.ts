import { isOwnUi } from './dom'

export type Role = 'user' | 'assistant'

export interface Turn {
  readonly role: Role
  readonly element: HTMLElement
  readonly id: string | null
  readonly text: () => string
}

const UNIT = '[data-chatgpt-search-unit-key]'
const UNIT_ROLE = /:(user|assistant)$/
const USER_CONTENT = '[data-user-message-bubble]'
const ASSISTANT_CONTENT = '[data-markdown-copy="contents"], [data-dil-response], [data-markdown-text-style]'
const LEGACY = '[data-message-author-role]'

const make = (role: Role, container: HTMLElement, content: HTMLElement): Turn => ({
  role,
  element: content,
  id: container.getAttribute('data-chatgpt-search-message-ids')?.split(' ')[0] ?? null,
  text: () => (content.innerText ?? '').trim()
})

const fromUnits = (): Turn[] =>
  [...document.querySelectorAll<HTMLElement>(UNIT)].flatMap((unit): Turn[] => {
    const role = UNIT_ROLE.exec(unit.getAttribute('data-chatgpt-search-unit-key') ?? '')?.[1]
    if (isOwnUi(unit) || (role !== 'user' && role !== 'assistant')) return []
    return [make(role, unit, unit.querySelector<HTMLElement>(role === 'user' ? USER_CONTENT : ASSISTANT_CONTENT) ?? unit)]
  })

const fromLegacy = (): Turn[] =>
  [...document.querySelectorAll<HTMLElement>(LEGACY)].flatMap((element): Turn[] => {
    const role = element.getAttribute('data-message-author-role')
    return !isOwnUi(element) && (role === 'user' || role === 'assistant') ? [make(role, element, element)] : []
  })

export const findTurns = (): Turn[] => {
  const units = fromUnits()
  return units.length ? units : fromLegacy()
}

export const countTurns = (): Record<Role, number> => {
  const turns = findTurns()
  return { user: turns.filter((turn) => turn.role === 'user').length, assistant: turns.filter((turn) => turn.role === 'assistant').length }
}

export const findScroller = (): HTMLElement | null => {
  let node: HTMLElement | null = findTurns()[0]?.element.parentElement ?? null
  while (node && node !== document.body) {
    const overflow = getComputedStyle(node).overflowY
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) return node
    node = node.parentElement
  }
  return null
}
