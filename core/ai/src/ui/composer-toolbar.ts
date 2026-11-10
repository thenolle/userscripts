import { createElement, injectStyle } from '@nolly/core'
import { platform } from '../platform'
import { markUi, uiConfig } from './config'

const ORDER = ['config', 'big', 'prompts', 'batch', 'queue', 'recall', 'context']
const MODE = /^(?:switch to |select |use )?(?:pro search|pro|search|deep research|research|labs?|computer|agentic(?: research)?|think|thinking)(?: mode)?$/i
const EXCLUDED = 'header, aside, dialog, [role="dialog"], [data-code-block], .cm-editor'
const tools = new Map<string, HTMLElement>()
let dock: HTMLElement | null = null

const CSS = `
.bp-composer-tools {
	display: inline-flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 3px;
	min-width: 0;
	max-width: 100%;
	margin-inline-start: 6px;
	pointer-events: auto;
	vertical-align: middle;
}
.bp-composer-tools > button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 30px;
	height: 30px;
	padding: 0;
	border: 1px solid transparent;
	border-radius: 6px;
	background: transparent;
	color: var(--bp-muted);
	cursor: pointer;
	pointer-events: auto;
}
.bp-composer-tools > button:hover {
	border-color: var(--bp-border);
	background: var(--bp-accent);
	color: var(--bp-fg);
}
.bp-composer-tools > button:focus-visible {
	outline: 2px solid var(--bp-ring);
	outline-offset: 1px;
}
.bp-composer-tools svg { pointer-events: none; }
`

const labelOf = (element: HTMLElement): string => (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim()

const locate = (): { parent: HTMLElement; after: HTMLElement | null } | null => {
	const editable = platform().composer.findComposer()
	if (!editable?.isConnected || editable.closest(EXCLUDED)) return null
	const actions = uiConfig().composerActions?.()
	const submit = actions?.submit
	if (!submit?.isConnected || submit.closest(EXCLUDED)) return null
	let scope = editable.parentElement
	let root: HTMLElement | null = null
	for (let depth = 0; scope && depth < 8; depth++, scope = scope.parentElement) {
		if (scope === document.body || scope.tagName === 'MAIN') break
		if (scope.contains(submit)) {
			root = scope
			break
		}
	}
	if (!root) return null
	const modes = [...root.querySelectorAll<HTMLElement>('button, [role="tab"], [role="radio"]')].filter((element) => {
		const rect = element.getBoundingClientRect()
		return !uiConfig().marker.isOwn(element) && !element.closest(EXCLUDED) && MODE.test(labelOf(element)) && rect.width > 0 && rect.height > 0
	})
	const lastMode = modes.at(-1)
	if (lastMode) {
		let anchor = lastMode
		for (let depth = 0; depth < 4; depth++) {
			const parent = anchor.parentElement
			if (!parent || parent === root) break
			const display = getComputedStyle(parent).display
			if (display === 'flex' || display === 'inline-flex') return { parent, after: anchor }
			anchor = parent
		}
		if (lastMode.parentElement) return { parent: lastMode.parentElement, after: lastMode }
	}
	const first = actions?.first
	if (first?.isConnected && root.contains(first) && first.parentElement) return { parent: first.parentElement, after: first }
	return submit.parentElement ? { parent: submit.parentElement, after: null } : null
}

const mountDock = (): boolean => {
	const location = locate()
	if (!location) {
		dock?.remove()
		return false
	}
	if (!dock) {
		dock = markUi(createElement('div', 'bp-composer-tools bp-themed'))
		dock.setAttribute('role', 'group')
		dock.setAttribute('aria-label', 'Better AI composer tools')
		injectStyle(`${uiConfig().id}-composer-tools`, CSS)
	}
	if (location.after) {
		if (location.after.nextElementSibling !== dock) location.after.insertAdjacentElement('afterend', dock)
	} else {
		const submit = uiConfig().composerActions?.().submit
		if (!submit || submit.parentElement !== location.parent) return false
		if (submit.previousElementSibling !== dock) location.parent.insertBefore(dock, submit)
	}
	const entries = [...tools.entries()].sort(([a], [b]) => {
		const left = ORDER.indexOf(a)
		const right = ORDER.indexOf(b)
		return (left < 0 ? 100 : left) - (right < 0 ? 100 : right) || a.localeCompare(b)
	})
	entries.forEach(([, element], index) => {
		const expected = dock!.children[index] ?? null
		if (expected !== element) dock!.insertBefore(element, expected)
	})
	return true
}

export const mountComposerTool = (element: HTMLElement, id: string): boolean => {
	tools.set(id, element)
	return mountDock()
}

export const unmountComposerTool = (element: HTMLElement, id: string): void => {
	if (tools.get(id) === element) tools.delete(id)
	element.remove()
	if (!tools.size) dock?.remove()
}
