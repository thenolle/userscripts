import { getElement } from '@nolly/core'
import { logger } from '../../core/logger'
import { MODE_ITEMS } from '../../selectors'
import { MODE_MAP } from './definitions'
import type { ModeInfo } from './types'

const STATE_ATTRIBUTES = ['aria-pressed', 'aria-checked', 'aria-selected', 'aria-current', 'data-state', 'data-active', 'data-selected'] as const
const ACTIVE_VALUES = new Set(['true', 'on', 'checked', 'active', 'selected'])
const ACTIVE_CLASS = /\b(active|selected|checked)\b|(?:bg|text|border)-super/

interface Candidate {
  id: string
  label: string
  element: HTMLElement
  score: number
}

export class ModeDetector {
  private readonly reported = new Set<string>()

  detect(): ModeInfo | null {
    const candidates = MODE_ITEMS.flatMap(({ id, button, label }): Candidate[] => {
      const element = getElement(button)
      if (!element) return []
      const text = (getElement(label)?.textContent ?? element.textContent ?? '').trim()
      return text ? [{ id, label: text, element, score: this.score(element) }] : []
    })
    if (!candidates.length) return null
    const ranked = [...candidates].sort((a, b) => b.score - a.score)
    if (ranked.length > 1 && ranked[0]!.score === ranked[1]!.score) this.reportAmbiguity(candidates)
    const selected = ranked[0]!
    return { label: selected.label, key: MODE_MAP.find(({ match }) => match.test(selected.label))?.key ?? null }
  }

  private score(element: HTMLElement): number {
    let score = 0
    for (const attribute of STATE_ATTRIBUTES) {
      const value = element.getAttribute(attribute)?.toLowerCase()
      if (value && ACTIVE_VALUES.has(value)) score += 2
    }
    if (ACTIVE_CLASS.test(element.getAttribute('class') ?? '')) score += 1
    return score
  }

  private reportAmbiguity(candidates: readonly Candidate[]): void {
    const details = candidates.map(({ id, label, element }) => ({
      id,
      label,
      class: element.getAttribute('class'),
      attributes: Object.fromEntries(STATE_ATTRIBUTES.map((attribute) => [attribute, element.getAttribute(attribute)]))
    }))
    const signature = JSON.stringify(details)
    if (this.reported.has(signature)) return
    this.reported.add(signature)
    logger.debug('Mode buttons look identical, defaulting to the first one.', details)
  }
}