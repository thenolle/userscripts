import { createElement } from './dom'

export const injectStyle = (id: string, css: string): void => {
  const existing = document.getElementById(id)
  const style = existing ?? createElement('style')
  style.id = id
  style.textContent = css
  if (!existing) document.head.appendChild(style)
}

export const removeStyle = (id: string): void => {
  document.getElementById(id)?.remove()
}
