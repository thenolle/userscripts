import { Feature, getElement } from '@nolly/core'
import type { MenuEntry, ScriptContext, ScriptStorage } from '@nolly/core'
import { isOwnUi } from '../../ui/config'
import { StyleManager } from './style-manager'

const SIDEBAR_KEY = 'max-width:remove-sidebar'
const DEFAULT_CONSTRAINED = 'main [class*="max-w-"], main [style*="max-width"]'
const EXCLUDED = ['header', 'pre', 'code', '[data-code-block]', '[role="dialog"]', '[role="menu"]', '[role="listbox"]', '[role="tooltip"]', 'dialog', '[data-radix-popper-content-wrapper]'].join(', ')

const SCAN_INTERVAL = 1_200
const GUTTER = '12px'

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

const safeTarget = (element: HTMLElement): boolean => element.isConnected && !isOwnUi(element) && !element.closest(EXCLUDED) && element.closest('main') !== null

export class MaxWidthFeature extends Feature {
	readonly id = 'max-width'
	readonly name = 'Max Width'
	readonly description = 'Use the available content width without overflowing the page or removing its side padding.'

	private readonly styles = new StyleManager()
	private readonly touched = new Map<HTMLElement, Set<string>>()
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
		if (!active) {
			this.restore()
			return
		}
		for (const rule of this.options.layout ?? []) {
			const element = resolveTarget(rule)
			if (!element || !safeTarget(element)) continue
			this.apply(element, { ...rule.styles, 'box-sizing': 'border-box', 'min-width': '0', 'max-width': '100%' })
		}
		this.expand()
	}

	override onDisable(): void {
		this.restore()
		for (const rule of this.options.hidden ?? []) this.syncHidden(rule, false)
		if (this.options.sidebar) this.syncHidden(this.options.sidebar.rule, false)
	}

	override menuEntries(): MenuEntry[] {
		const sidebar = this.options.sidebar
		return sidebar ? [{
			label: `${this.removeSidebar ? 'Show' : 'Remove'} ${sidebar.label}`,
			action: () => {
				this.removeSidebar = !this.removeSidebar
				this.context.refreshMenu()
				this.context.requestUpdate()
			}
		}] : []
	}

	private apply(element: HTMLElement, values: Readonly<Record<string, string>>): void {
		const properties = this.touched.get(element) ?? new Set<string>()
		for (const property of Object.keys(values)) properties.add(property)
		this.touched.set(element, properties)
		this.styles.apply(element, values)
	}

	private expand(): void {
		const now = Date.now()
		if (now - this.scannedAt < SCAN_INTERVAL) return
		this.scannedAt = now
		for (const element of this.touched.keys()) {
			if (!element.isConnected) this.touched.delete(element)
		}
		const candidates = [...document.querySelectorAll<HTMLElement>(this.options.constrained ?? DEFAULT_CONSTRAINED)].filter((element) => {
			if (!safeTarget(element)) return false
			const rect = element.getBoundingClientRect()
			if (rect.width < 320) return false
			const maximum = Number.parseFloat(getComputedStyle(element).maxWidth)
			return this.touched.has(element) || Number.isFinite(maximum) && maximum >= 480
		})
		const outermost = candidates.filter((element) => !candidates.some((other) => other !== element && other.contains(element)))
		for (const element of candidates) this.apply(element, { 'box-sizing': 'border-box', 'min-width': '0', 'max-width': '100%' })
		for (const [element, properties] of this.touched) {
			if (!outermost.includes(element) && properties.has('padding-inline-start')) {
				this.styles.restore(element, ['padding-inline-start', 'padding-inline-end'])
				properties.delete('padding-inline-start')
				properties.delete('padding-inline-end')
			}
		}
		for (const element of outermost) this.apply(element, { 'padding-inline-start': GUTTER, 'padding-inline-end': GUTTER })
	}

	private syncHidden(rule: HideRule, hidden: boolean): void {
		const element = resolveTarget(rule)
		if (element) this.styles.setHidden(element, hidden, rule.xpath ?? rule.selector ?? rule.id)
	}

	private restore(): void {
		for (const [element, properties] of this.touched) this.styles.restore(element, [...properties])
		this.touched.clear()
		this.scannedAt = 0
	}
}
