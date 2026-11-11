import { createElement } from '@nolly/core'
import { markUi } from '../../core/dom'
import { Tooltip, ensureUiStyles } from '@nolly/ai'
import { Dock } from './dock'
import { isPlaced, type Placement } from './placement'
import type { UsageService } from './service'
import { renderUsageTooltip } from './tooltip-content'
import { ensureUsageStyles } from './styles'
import { STATUS_LABELS } from './definitions'

export class UsageIndicator {
	readonly element = markUi(createElement('div', 'bp-usage-indicator bp-themed'))
	private readonly count = createElement('span', 'bp-usage-count', '…')
	private readonly unit = createElement('span', 'bp-usage-unit')
	private readonly mode = createElement('span', 'bp-usage-mode')
	private readonly fill = createElement('div', 'bp-usage-meter-fill')
	private readonly meter = createElement('div', 'bp-usage-meter')
	private readonly trigger = createElement('button', 'bp-usage-trigger')
	private readonly dock = new Dock(this.element)
	private readonly tooltip: Tooltip

	constructor(private readonly service: UsageService, onOpen: () => void) {
		ensureUiStyles()
		ensureUsageStyles()
		this.element.dataset['status'] = 'unavailable'
		this.meter.appendChild(this.fill)
		this.trigger.type = 'button'
		this.trigger.append(createElement('span', 'bp-usage-dot'), this.count, this.unit, this.meter, this.mode)
		this.trigger.addEventListener('click', onOpen)
		this.element.appendChild(this.trigger)
		this.tooltip = new Tooltip(this.trigger, (container) => renderUsageTooltip(container, service), { align: 'start' })
	}

	mount(placement: Placement): void {
		if (this.element.dataset['placement'] !== placement.mode) this.element.dataset['placement'] = placement.mode
		if (!isPlaced(this.element, placement)) {
			placement.anchor.insertAdjacentElement(placement.position, this.element)
			this.render()
		}
		if (placement.mode === 'dock') {
			this.dock.attach()
			this.dock.refresh()
		} else {
			this.dock.detach()
		}
	}

	render(): void {
		const active = this.service.getActive()
		const loading = this.service.fetching && !this.service.initialized
		this.element.dataset['status'] = active.status
		if (loading) this.setText('…', 'Loading usage', '')
		else if (active.freeFallback) this.setText('Free', 'queries', active.label)
		else if (active.remaining === null) this.setText('—', this.service.lastError ? 'unavailable' : 'no data', active.label)
		else this.setText(String(active.remaining), 'left', active.label)
		const ratio = active.total && active.remaining !== null ? Math.max(0, Math.min(1, active.remaining / active.total)) : null
		this.meter.hidden = ratio === null
		if (ratio !== null) this.fill.style.width = `${(ratio * 100).toFixed(1)}%`
		this.trigger.setAttribute('aria-label', `${this.trigger.getAttribute('aria-label') ?? ''} — ${STATUS_LABELS[active.status]}`)
		this.tooltip.refresh()
	}

	destroy(): void {
		this.dock.detach()
		this.tooltip.destroy()
		this.element.remove()
	}

	private setText(count: string, unit: string, mode: string): void {
		if (this.count.textContent !== count) this.count.textContent = count
		if (this.unit.textContent !== unit) this.unit.textContent = unit
		if (this.mode.textContent !== mode) this.mode.textContent = mode
		this.mode.hidden = mode === ''
		this.trigger.setAttribute('aria-label', `View Perplexity usage: ${count} ${unit}${mode ? `, ${mode}` : ''}`)
	}
}
