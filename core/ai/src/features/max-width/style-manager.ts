import { logger } from '../../platform'

interface OriginalValue {
  readonly value: string
  readonly priority: string
}

export class StyleManager {
  private readonly originals = new WeakMap<HTMLElement, Map<string, OriginalValue>>()
  private readonly hidden = new WeakSet<HTMLElement>()

  apply(element: HTMLElement, styles: Readonly<Record<string, string>>): void {
    const originals = this.originals.get(element) ?? new Map<string, OriginalValue>()
    this.originals.set(element, originals)
    for (const [property, value] of Object.entries(styles)) {
      if (!originals.has(property)) originals.set(property, { value: element.style.getPropertyValue(property), priority: element.style.getPropertyPriority(property) })
      if (element.style.getPropertyValue(property) === value && element.style.getPropertyPriority(property) === 'important') continue
      element.style.setProperty(property, value, 'important')
    }
  }

  restore(element: HTMLElement, properties: readonly string[]): void {
    const originals = this.originals.get(element)
    if (!originals) return
    for (const property of properties) {
      const original = originals.get(property)
      if (!original) continue
      if (original.value) element.style.setProperty(property, original.value, original.priority)
      else element.style.removeProperty(property)
      originals.delete(property)
    }
  }

  setHidden(element: HTMLElement, hidden: boolean, label: string): void {
    if (hidden) {
      const applied = element.style.getPropertyValue('display') === 'none' && element.style.getPropertyPriority('display') === 'important'
      if (applied) return
      element.style.setProperty('display', 'none', 'important')
      if (!this.hidden.has(element)) {
        this.hidden.add(element)
        logger.debug('Element hidden.', label)
      }
      return
    }
    if (!this.hidden.has(element)) return
    element.style.removeProperty('display')
    this.hidden.delete(element)
    logger.debug('Element restored.', label)
  }
}
