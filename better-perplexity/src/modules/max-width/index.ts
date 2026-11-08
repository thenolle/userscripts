import { getElement } from '../../core/dom'
import { logger } from '../../core/logger'
import { FeatureModule, type MenuEntry } from '../../core/module'
import { storage } from '../../core/storage'
import { ALWAYS_HIDDEN, LAYOUT_RULES, RIGHT_SIDEBAR, type HideRule } from './rules'
import { StyleManager } from './style-manager'

const SIDEBAR_KEY = 'max-width:remove-sidebar'

export class MaxWidthModule extends FeatureModule {
  readonly id = 'max-width'
  readonly name = 'Max Width'
  readonly description = 'Remove width restrictions and expand the interface.'

  private readonly styles = new StyleManager()

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
  }

  override menuEntries(): MenuEntry[] {
    return [{ label: `${this.removeSidebar ? 'Show' : 'Remove'} Right Sidebar`, action: () => this.toggleSidebar() }]
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