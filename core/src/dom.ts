import type { Teardown } from './scope'
import { createLogger } from './logger'

const logger = createLogger('core')

export const getElement = <T extends Element = HTMLElement>(xpath: string): T | null => {
	try {
		const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
		return result.singleNodeValue as T | null
	} catch (error) {
		logger.errorOnce(`Invalid XPath: ${xpath}`, error)
		return null
	}
}

export const query = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T | null => root.querySelector<T>(selector)

export const queryAll = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] => [...root.querySelectorAll<T>(selector)]

export const createElement = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, content?: string): HTMLElementTagNameMap[K] => {
	const element = document.createElement(tag)
	if (className) element.className = className
	if (content !== undefined) element.textContent = content
	return element
}

export interface ElementProps {
	readonly class?: string
	readonly text?: string
	readonly attrs?: Readonly<Record<string, string>>
	readonly on?: Readonly<Record<string, EventListener>>
}

export const h = <K extends keyof HTMLElementTagNameMap>(tag: K, props: ElementProps = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] => {
	const element = createElement(tag, props.class, props.text)
	for (const [name, value] of Object.entries(props.attrs ?? {})) element.setAttribute(name, value)
	for (const [type, listener] of Object.entries(props.on ?? {})) element.addEventListener(type, listener)
	element.append(...children)
	return element
}

export const toElement = (target: EventTarget | null): Element | null => {
	if (target instanceof Element) return target
	return target instanceof Node ? target.parentElement : null
}

export interface UiMarker {
	readonly attribute: string
	mark<T extends HTMLElement>(element: T): T
	isOwn(node: Node | null): boolean
}

export const createUiMarker = (attribute = 'data-us-root'): UiMarker => ({
	attribute,
	mark(element) {
		element.setAttribute(attribute, '')
		return element
	},
	isOwn(node) {
		const element = node instanceof Element ? node : node?.parentElement
		return Boolean(element?.closest(`[${attribute}]`))
	}
})

export interface WaitForElementOptions {
	readonly root?: ParentNode
	readonly timeout?: number
	readonly signal?: AbortSignal
}

export const waitForElement = <T extends Element = HTMLElement>(selector: string, { root = document, timeout = 10_000, signal }: WaitForElementOptions = {}): Promise<T | null> => new Promise((resolve) => {
	const existing = root.querySelector<T>(selector)
	if (existing || signal?.aborted) {
		resolve(existing)
		return
	}
	const observer = new MutationObserver(() => {
		const element = root.querySelector<T>(selector)
		if (element) finish(element)
	})
	const timer = window.setTimeout(() => finish(null), timeout)
	const onAbort = (): void => finish(null)
	const finish = (value: T | null): void => {
		observer.disconnect()
		window.clearTimeout(timer)
		signal?.removeEventListener('abort', onAbort)
		resolve(value)
	}
	signal?.addEventListener('abort', onAbort, { once: true })
	observer.observe(root instanceof Document ? root.documentElement : (root as Node), { childList: true, subtree: true })
})

export const observe = (target: Node, callback: MutationCallback, options: MutationObserverInit = { childList: true, subtree: true }): Teardown => {
	const observer = new MutationObserver(callback)
	observer.observe(target, options)
	return () => observer.disconnect()
}
