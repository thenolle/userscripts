import { findComposer } from './core/composer'
import { isOwnUi } from './core/dom'

export const STATE_ATTRIBUTES = ['aria-pressed', 'aria-checked', 'aria-selected', 'aria-current', 'data-state', 'data-active', 'data-selected'] as const

export const MODE_LABEL = /^(?:switch to |select |use )?(pro search|pro|search|deep research|research|labs?|computer|agentic(?: research)?)(?: mode)?$/i

const ACTIONABLE = 'button, [role="button"], [role="radio"], [role="tab"], [role="option"], [role="menuitemradio"], [role="switch"]'
const AVATAR = ['[data-testid*="avatar" i]', 'img[alt*="avatar" i]', 'img[alt*="profile" i]', '[class*="avatar" i]', 'button[aria-label*="account" i]', 'button[aria-label*="profile" i]', 'button[aria-label*="user" i]'].join(', ')
const SIGN_IN = /^(sign in|log in|sign up|create account|se connecter|connexion)$/i
const MEMO_MS = 80

export interface ComposerActions {
	readonly first: HTMLElement | null
	readonly submit: HTMLElement | null
}

export interface ModeControl {
	readonly element: HTMLElement
	readonly label: string
}

const NONE: ComposerActions = { first: null, submit: null }
let memo: { at: number; value: ComposerActions } | null = null

const isVisible = (element: Element): boolean => {
	const rect = element.getBoundingClientRect()
	return rect.width > 0 && rect.height > 0
}

export const labelOf = (element: Element): string => (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '').replace(/\s+/g, ' ').trim()

const actionable = (root: ParentNode, selector = ACTIONABLE): HTMLElement[] => [...root.querySelectorAll<HTMLElement>(selector)].filter((element) => !isOwnUi(element) && isVisible(element))

const isSubmit = (button: HTMLElement): boolean => (button as HTMLButtonElement).type === 'submit' || /\b(submit|send|ask|envoyer)\b/i.test(labelOf(button))

export const composerScope = (): HTMLElement | null => {
	const editable = findComposer()
	if (!editable) return null
	let scope: HTMLElement = editable
	for (let depth = 0; depth < 7; depth++) {
		const parent = scope.parentElement
		if (!parent || parent === document.body || parent.tagName === 'MAIN') break
		if (actionable(parent).length > 40) break
		scope = parent
	}
	return scope
}

export const findModeControls = (): ModeControl[] => {
	const scope = composerScope() ?? document.body
	return actionable(scope).flatMap((element): ModeControl[] => {
		const label = labelOf(element)
		return label.length <= 32 && MODE_LABEL.test(label) ? [{ element, label }] : []
	})
}

const locateActions = (): ComposerActions => {
	const editable = findComposer()
	if (!editable) return NONE
	const box = editable.getBoundingClientRect()
	const centre = box.top + box.height / 2
	let node = editable.parentElement
	for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
		const buttons = [...node.querySelectorAll<HTMLElement>('button')].filter((button) => {
			if (isOwnUi(button) || !isVisible(button) || editable.contains(button)) return false
			const rect = button.getBoundingClientRect()
			return Math.abs(rect.top + rect.height / 2 - centre) <= Math.max(160, box.height)
		})
		if (buttons.length < 2) continue
		const submit = buttons.find(isSubmit) ?? buttons[buttons.length - 1] ?? null
		const first = buttons.find((button) => button !== submit && !MODE_LABEL.test(labelOf(button))) ?? null
		return { first, submit }
	}
	return NONE
}

export const findComposerActions = (): ComposerActions => {
	const now = performance.now()
	if (memo && now - memo.at < MEMO_MS) return memo.value
	const value = locateActions()
	memo = { at: now, value }
	return value
}

export const findAvatar = (): HTMLElement | null => {
	const candidates = actionable(document, AVATAR).filter((element) => {
		const rect = element.getBoundingClientRect()
		return rect.top < 120 && rect.left > window.innerWidth * 0.4 && rect.width <= 96 && rect.height <= 96
	})
	const hit = candidates.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)[0]
	if (!hit) return null
	let node = hit
	for (; ;) {
		const parent = node.parentElement
		if (!parent) return node
		const rect = parent.getBoundingClientRect()
		if (rect.width > 72 || rect.height > 72) return node
		node = parent
	}
}

export const hasSignInPrompt = (): boolean => actionable(document, 'button, a[href], [role="button"]').some((element) => SIGN_IN.test(labelOf(element)))

const brief = (element: Element | null): Record<string, unknown> | null => element ? {
	tag: element.tagName.toLowerCase(),
	label: labelOf(element).slice(0, 40),
	class: (element.getAttribute('class') ?? '').slice(0, 120),
	state: Object.fromEntries(STATE_ATTRIBUTES.flatMap((name) => (element.getAttribute(name) === null ? [] : [[name, element.getAttribute(name)]])))
} : null

export const describePage = (): Record<string, unknown> => {
	const actions = findComposerActions()
	return {
		path: location.pathname,
		composer: brief(findComposer()),
		avatar: brief(findAvatar()),
		signInPrompt: hasSignInPrompt(),
		composerActions: { first: brief(actions.first), submit: brief(actions.submit) },
		modeControls: findModeControls().map(({ element }) => brief(element))
	}
}

export const findHeaderSlot = (): HTMLElement | null => {
  const buttons = actionable(document, 'button, [role="button"], a[href]').filter((element) => {
    const rect = element.getBoundingClientRect()
    return rect.top >= 0 && rect.bottom <= 96 && rect.left > window.innerWidth * 0.35 && rect.width <= 220 && rect.height <= 64
  })
  if (!buttons.length) return null
  const sorted = buttons.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)
  let leftmost = sorted[0]!
  for (const button of sorted.slice(1)) {
    if (leftmost.getBoundingClientRect().left - button.getBoundingClientRect().right > 120) break
    leftmost = button
  }
  let node: HTMLElement = leftmost
  while (node.parentElement && node.parentElement.children.length === 1 && node.parentElement.getBoundingClientRect().width < 260) node = node.parentElement
  return node
}
