import { logger } from './logger'

export const UI_ROOT_ATTRIBUTE = 'data-bp-root'

export const getElement = <T extends Element = HTMLElement>(xpath: string): T | null => {
  try {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return result.singleNodeValue as T | null
  } catch (error) {
    logger.errorOnce(`Invalid XPath: ${xpath}`, error)
    return null
  }
}

export const createElement = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, content?: string): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (content !== undefined) element.textContent = content
  return element
}

export const toElement = (target: EventTarget | null): Element | null => {
  if (target instanceof Element) return target
  return target instanceof Node ? target.parentElement : null
}

export const markUi = <T extends HTMLElement>(element: T): T => {
  element.setAttribute(UI_ROOT_ATTRIBUTE, '')
  return element
}

export const isOwnUi = (node: Node | null): boolean => {
  const element = node instanceof Element ? node : node?.parentElement
  return Boolean(element?.closest(`[${UI_ROOT_ATTRIBUTE}]`))
}