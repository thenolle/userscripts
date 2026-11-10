import { Feature, getElement } from '@nolly/core'
import type { MenuEntry, ScriptContext, ScriptStorage } from '@nolly/core'
import { isOwnUi } from '../../ui/config'
import { StyleManager } from './style-manager'

const SIDEBAR_KEY = 'max-width:remove-sidebar'
const DEFAULT_CONSTRAINED = 'main [class*="max-w-"], main [style*="max-width"]'
const OVERLAYS = '[role="dialog"], [role="menu"], [role="listbox"], [role="tooltip"], dialog, [data-radix-popper-content-wrapper]'
const MIN_CONSTRAINT = 480
const SCAN_INTERVAL = 1_200

export interface Target {
  readonly xpath?: string
  readonly selector?: string
}

export interface HideRule extends Target {
  readonly id: string
}

export interface LayoutRule extends Target {
  readonly styles: Readonly<Record<string, string>>
}

export interface SidebarOption {
  readonly rule: HideRule
  readonly label: string
  readonly defaultRemoved: boolean
}

export interface MaxWidthOptions {
  readonly storage: ScriptStorage
  readonly hidden?: readonly HideRule[]
  readonly layout?: readonly LayoutRule[]
  readonly sidebar?: SidebarOption
  readonly constrained?: string
}

const resolveTarget = ({ xpath, selector }: Target): HTMLElement | null => {
  if (xpath) return getElement(xpath)
  return selector ? document.querySelector<HTMLElement>(selector) : null
}

const labelOf = (rule: HideRule): string => rule.xpath ?? rule.selector ?? rule.id

export class MaxWidthFeature extends Feature {
  readonly id = 'max-width'
  readonly name = 'Max Width'
  readonly description = 'Remove width restrictions and expand the interface.'

  private readonly styles = new StyleManager()
  private readonly touched = new Set<HTMLElement>()
  private scannedAt = 0

  constructor(context: ScriptContext, private readonly options: MaxWidthOptions) {
    super(context)
  }

  get removeSidebar(): boolean {
    return this.options.storage.get(SIDEBAR_KEY, this.options.sidebar?.defaultRemoved ?? false)
  }

  set removeSidebar(value: boolean) {
    this.options.storage.set(SIDEBAR_KEY, value)
  }

  run(): void {
    const active = this.enabled
    for (const rule of this.options.hidden ?? []) this.syncHidden(rule, active)
    if (this.options.sidebar) this.syncHidden(this.options.sidebar.rule, active && this.removeSidebar)
    for (const rule of this.options.layout ?? []) {
      const element = resolveTarget(rule)
      if (!element) continue
      if (active) this.styles.apply(element, rule.styles)
      else this.styles.restore(element, Object.keys(rule.styles))
    }
    this.expand(active)
  }

  override menuEntries(): MenuEntry[] {
    const { sidebar } = this.options
    return sidebar ? [{ label: `${this.removeSidebar ? 'Show' : 'Remove'} ${sidebar.label}`, action: () => this.toggleSidebar(sidebar) }] : []
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
    for (const element of document.querySelectorAll<HTMLElement>(this.options.constrained ?? DEFAULT_CONSTRAINED)) {
      if (this.touched.has(element) || isOwnUi(element) || element.closest(OVERLAYS)) continue
      const limit = Number.parseFloat(getComputedStyle(element).maxWidth)
      if (!Number.isFinite(limit) || limit < MIN_CONSTRAINT) continue
      if (element.getBoundingClientRect().width < limit * 0.9) continue
      this.styles.apply(element, { 'max-width': '100%' })
      this.touched.add(element)
    }
  }

  private syncHidden(rule: HideRule, hidden: boolean): void {
    const element = resolveTarget(rule)
    if (element) this.styles.setHidden(element, hidden, labelOf(rule))
  }

  private toggleSidebar(sidebar: SidebarOption): void {
    this.removeSidebar = !this.removeSidebar
    this.context.logger.info(`${sidebar.label} removal ${this.removeSidebar ? 'enabled' : 'disabled'}.`)
    this.context.refreshMenu()
    this.context.requestUpdate()
  }
}
