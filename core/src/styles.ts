import { createElement } from './dom'
import type { Teardown } from './scope'

export const injectStyle = (id: string, css: string): Teardown => {
  const existing = document.getElementById(id)
  const style = existing ?? createElement('style')
  style.id = id
  style.textContent = css
  if (!existing) document.head.appendChild(style)
  return () => style.remove()
}
