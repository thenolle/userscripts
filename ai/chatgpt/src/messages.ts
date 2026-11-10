import { isOwnUi } from './dom'

export type Role = 'user' | 'assistant'

export interface Turn {
  readonly role: Role
  readonly element: HTMLElement
  readonly text: () => string
}

const ROLE_ATTRIBUTE = 'data-message-author-role'

export const findTurns = (): Turn[] =>
  [...document.querySelectorAll<HTMLElement>(`[${ROLE_ATTRIBUTE}]`)].flatMap((element): Turn[] => {
    const role = element.getAttribute(ROLE_ATTRIBUTE)
    if (isOwnUi(element) || (role !== 'user' && role !== 'assistant')) return []
    return [{ role, element, text: () => (element.innerText ?? '').trim() }]
  })

export const countTurns = (): Record<Role, number> => {
  const turns = findTurns()
  return { user: turns.filter((turn) => turn.role === 'user').length, assistant: turns.filter((turn) => turn.role === 'assistant').length }
}
