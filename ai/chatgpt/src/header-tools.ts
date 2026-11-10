import { markUi } from './dom'

const ORDER = ['settings', 'usage', 'export', 'help'] as const

export type ToolId = (typeof ORDER)[number]

const visible = (element: HTMLElement): boolean => {
	const style = getComputedStyle(element)
	const rect = element.getBoundingClientRect()
	return !element.closest('[aria-hidden="true"], [inert]') && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
}

export const toolRow = (): HTMLElement | null => {
	const titlebars = [...document.querySelectorAll<HTMLElement>('[data-app-shell-main-titlebar="true"]')].filter(visible)
	for (const titlebar of titlebars) {
		const slots = [...titlebar.querySelectorAll<HTMLElement>('[data-app-shell-header-obstacle="true"]')].filter(visible)
		for (const slot of slots) {
			const rows = [...slot.querySelectorAll<HTMLElement>('.contents > div')].filter(visible)
			const nativeRow = rows.find((row) => [...row.children].some((child) => child instanceof HTMLButtonElement && !child.hasAttribute('data-bc-tool')))
			if (nativeRow) return nativeRow
		}
	}
	return null
}

export const placeTool = (button: HTMLElement, id: ToolId): boolean => {
	const row = toolRow()
	if (!row) return false
	markUi(button)
	button.dataset['bcTool'] = id
	button.style.setProperty('pointer-events', 'auto', 'important')
	button.style.setProperty('-webkit-app-region', 'no-drag', 'important')
	if (button.parentElement !== row) row.appendChild(button)
	const ours = ORDER.flatMap((name) => {
		const element = row.querySelector<HTMLElement>(`:scope > [data-bc-tool="${name}"]`)
		return element ? [element] : []
	})
	let cursor: Element | null = [...row.children].filter((child) => !child.hasAttribute('data-bc-tool')).at(-1) ?? null
	for (const element of ours) {
		const wanted = cursor ? cursor.nextElementSibling : row.firstElementChild
		if (wanted !== element) row.insertBefore(element, wanted)
		cursor = element
	}
	return true
}
