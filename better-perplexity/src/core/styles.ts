import { createElement } from './dom'

export const injectStyle = (id: string, css: string): void => {
  if (document.getElementById(id)) return
  const style = createElement('style')
  style.id = id
  style.textContent = css
  document.head.appendChild(style)
}