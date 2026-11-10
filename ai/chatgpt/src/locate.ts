import { isOwnUi } from './dom'
import { SELECTORS, STOP_LABEL, STOP_TEST_ID } from './selectors'

export type PrimaryKind = 'send' | 'stop' | 'voice'

export interface PrimaryAction {
	readonly element: HTMLButtonElement
	readonly kind: PrimaryKind
}

export interface ModeToggle {
	readonly element: HTMLElement
	readonly label: string
	readonly pressed: boolean
}

const visible = (element: Element): boolean => {
	const rect = element.getBoundingClientRect()
	return rect.width > 0 && rect.height > 0
}

export const labelOf = (element: Element): string => (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '').replace(/\s+/g, ' ').trim()

export const rejectEditable = (element: HTMLElement): boolean => element.closest(SELECTORS.codeSurface) !== null

export const findComposerForm = (): HTMLFormElement | null => {
	const forms = [...document.querySelectorAll<HTMLFormElement>(SELECTORS.composerForm)].filter((form) => !isOwnUi(form) && visible(form))
	return forms.at(-1) ?? null
}

export const locateEditable = (): HTMLElement | null => {
	const form = findComposerForm()
	if (!form) return null
	const candidates = [...form.querySelectorAll<HTMLElement>(SELECTORS.editable)].filter((element) => !isOwnUi(element) && !rejectEditable(element) && visible(element))
	return candidates.at(-1) ?? null
}

const classify = (button: HTMLButtonElement): PrimaryKind => {
	if (button.type === 'submit') return 'send'
	if (STOP_LABEL.test(labelOf(button)) || STOP_TEST_ID.test(button.getAttribute('data-testid') ?? '')) return 'stop'
	return 'voice'
}

export const findPrimaryAction = (): PrimaryAction | null => {
	const fieldset = findComposerForm()?.querySelector('fieldset')
	if (!fieldset) return null
	const element = [...fieldset.querySelectorAll<HTMLButtonElement>('button')].filter((button) => !isOwnUi(button) && visible(button)).at(-1)
	return element ? { element, kind: classify(element) } : null
}

export const findSendButton = (): HTMLButtonElement | null => {
	const action = findPrimaryAction()
	return action?.kind === 'send' && !action.element.disabled ? action.element : null
}

export const findStopButton = (): HTMLButtonElement | null => {
	const action = findPrimaryAction()
	return action?.kind === 'stop' ? action.element : null
}

export const findAttachButton = (): HTMLElement | null => findComposerForm()?.querySelector<HTMLElement>(SELECTORS.attach) ?? null

export const findModeToggles = (): ModeToggle[] => {
	const form = findComposerForm()
	if (!form) return []
	return [...form.querySelectorAll<HTMLElement>(SELECTORS.modeToggle)].filter((element) => !isOwnUi(element) && visible(element) && (element.textContent ?? '').trim() !== '').map((element) => ({ element, label: labelOf(element), pressed: element.getAttribute('aria-pressed') === 'true' }))
}

export const findHeaderSlot = (): HTMLElement | null => document.querySelector<HTMLElement>(SELECTORS.headerSlot)

export const findSidebar = (): HTMLElement | null => document.querySelector<HTMLElement>(SELECTORS.sidebar)
