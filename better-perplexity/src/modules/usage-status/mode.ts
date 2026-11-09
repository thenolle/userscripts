import { logger } from '../../core/logger'
import { findModeControls, STATE_ATTRIBUTES, type ModeControl } from '../../locate'
import { LIMITS, MODE_MAP } from './definitions'
import type { LimitKey, ModeInfo, ModeSource } from './types'

const ACTIVE_VALUES = new Set(['true', 'on', 'checked', 'active', 'selected'])
const ACTIVE_CLASS = /\b(active|selected|checked)\b|(?:bg|text|border)-super/

interface Found {
  readonly label: string
  readonly selected: boolean
}

const score = (element: HTMLElement): number => {
  let total = 0
  for (const attribute of STATE_ATTRIBUTES) {
    const value = element.getAttribute(attribute)?.toLowerCase()
    if (value && ACTIVE_VALUES.has(value)) total += 2
  }
  if (ACTIVE_CLASS.test(element.getAttribute('class') ?? '')) total += 1
  return total
}

const keyOf = (label: string): LimitKey | null => MODE_MAP.find(({ match }) => match.test(label))?.key ?? null

const describe = (label: string, source: ModeSource): ModeInfo => ({ label, key: keyOf(label), source })

export class ModeDetector {
  private readonly reported = new Set<string>()
  private fallback: () => LimitKey | null = () => null

  setFallback(provider: () => LimitKey | null): void {
    this.fallback = provider
  }

  detect(): ModeInfo {
    const found = this.fromDom()
    if (found?.selected) return describe(found.label, 'dom')
    if (location.pathname.startsWith('/computer')) return describe('Computer', 'url')
    if (found) return describe(found.label, 'dom')
    const learned = this.fallback()
    if (learned) return { label: LIMITS[learned].label, key: learned, source: 'learned' }
    return describe('Pro Search', 'default')
  }

  private fromDom(): Found | null {
    const controls = findModeControls()
    if (!controls.length) return null
    const ranked = controls.map((control) => ({ control, score: score(control.element) })).sort((a, b) => b.score - a.score)
    const top = ranked[0]!
    const runnerUp = ranked.find((row) => row.control.label.toLowerCase() !== top.control.label.toLowerCase())
    if (top.score > 0) {
      if (runnerUp && runnerUp.score === top.score) {
        this.reportAmbiguity(controls)
        return null
      }
      return { label: top.control.label, selected: true }
    }
    if (!runnerUp && !/^search$/i.test(top.control.label)) return { label: top.control.label, selected: false }
    this.reportAmbiguity(controls)
    return null
  }

  private reportAmbiguity(controls: readonly ModeControl[]): void {
    const details = controls.map(({ element, label }) => ({ label, class: element.getAttribute('class'), state: Object.fromEntries(STATE_ATTRIBUTES.map((attribute) => [attribute, element.getAttribute(attribute)])) }))
    const signature = JSON.stringify(details)
    if (this.reported.has(signature)) return
    this.reported.add(signature)
    logger.debug('Mode buttons look identical; using the URL, the last used counter or the default.', details)
  }
}
