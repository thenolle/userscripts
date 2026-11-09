import { Feature, getElement, type MenuEntry } from '@nolly/core'
import { isOwnUi } from '../../core/dom'
import { logger } from '../../core/logger'
import { storage } from '../../core/storage'
import { ALWAYS_HIDDEN, LAYOUT_RULES, RIGHT_SIDEBAR, type HideRule } from './rules'
import { StyleManager } from './style-manager'

const SIDEBAR_KEY = 'max-width:remove-sidebar'
const CONSTRAINED = 'main [class*="max-w-"], main [style*="max-width"]'
const OVERLAYS = '[role="dialog"], [role="menu"], [role="listbox"], [role="tooltip"], dialog, [data-radix-popper-content-wrapper]'
const MIN_CONSTRAINT = 480
const SCAN_INTERVAL = 1_200

export class MaxWidthModule extends Feature {
  readonly id = 'max-width'
  readonly name = 'Max Width'
  readonly description = 'Remove width restrictions and expand the interface.'

  private readonly styles = new StyleManager()
  private readonly touched = new Set<HTMLElement>()
  private scannedAt = 0

  get removeSidebar(): boolean {
    return storage.get(SIDEBAR_KEY, true)
  }

  set removeSidebar(value: boolean) {
    storage.set(SIDEBAR_KEY, value)
  }

  run(): void {
    const active = this.enabled
    for (const rule of ALWAYS_HIDDEN) this.syncHidden(rule, active)
    this.syncHidden(RIGHT_SIDEBAR, active && this.removeSidebar)
    for (const { xpath, styles } of LAYOUT_RULES) {
      const element = getElement(xpath)
      if (!element) continue
      if (active) this.styles.apply(element, styles)
      else this.styles.restore(element, Object.keys(styles))
    }
    this.expand(active)
  }

  override menuEntries(): MenuEntry[] {
    return [{ label: `${this.removeSidebar ? 'Show' : 'Remove'} Right Sidebar`, action: () => this.toggleSidebar() }]
  }

  private expand(active: boolean): void {
    if (!active) {
      for (const element of this.touched) this.styles.restore(element, ['max-width'])
      this.touched.clear()
      return
    }
    const now = Date.now()
    if (now - this.scannedAt < SCAN_INTERVAL) return
    this.scannedAt = now
    for (const element of this.touched) if (!element.isConnected) this.touched.delete(element)
    for (const element of document.querySelectorAll<HTMLElement>(CONSTRAINED)) {
      if (this.touched.has(element) || isOwnUi(element) || element.closest(OVERLAYS)) continue
      const limit = Number.parseFloat(getComputedStyle(element).maxWidth)
      if (!Number.isFinite(limit) || limit < MIN_CONSTRAINT) continue
      if (element.getBoundingClientRect().width < limit * 0.9) continue
      this.styles.apply(element, { 'max-width': '100%' })
      this.touched.add(element)
    }
  }

  private syncHidden(rule: HideRule, hidden: boolean): void {
    const element = getElement(rule.xpath)
    if (element) this.styles.setHidden(element, hidden, rule.xpath)
  }

  private toggleSidebar(): void {
    this.removeSidebar = !this.removeSidebar
    logger.info(`Right sidebar removal ${this.removeSidebar ? 'enabled' : 'disabled'}.`)
    this.context.refreshMenu()
    this.context.requestUpdate()
  }
}
