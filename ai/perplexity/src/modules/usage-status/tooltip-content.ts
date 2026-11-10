import { createElement } from '@nolly/core'
import { createStatusBar } from './components'
import { LIMITS, LIMIT_KEYS, STATUS_LABELS } from './definitions'
import { formatAgo } from './format'
import type { UsageService } from './service'
import type { LimitKey } from './types'

const formatCount = (service: UsageService, key: LimitKey): string => {
	const remaining = service.getRemaining(key)
	if (remaining === null) return '—'
	const total = service.formatTotal(key)
	return total ? `${remaining} / ${total}` : String(remaining)
}

const createRow = (label: string, value: string, active = false): HTMLElement => {
	const row = createElement('div', active ? 'bp-tip-row active' : 'bp-tip-row')
	row.append(createElement('span', 'bp-tip-label', label), createElement('span', 'bp-tip-value', value))
	return row
}

export const renderUsageTooltip = (container: HTMLElement, service: UsageService): void => {
	const active = service.getActive()
	if (!active) {
		container.append(
			createElement('div', 'bp-tip-mode', service.fetching ? 'Loading usage…' : 'Usage unavailable'),
			createElement('div', 'bp-tip-sub', service.lastError?.message ?? 'The selected mode could not be identified yet.')
		)
		return
	}
	const head = createElement('div', 'bp-tip-head')
	head.append(createElement('span', 'bp-tip-mode', active.label), createElement('span', `bp-badge ${active.status}`, active.freeFallback ? 'Free queries' : STATUS_LABELS[active.status]))
	const count = createElement('div', 'bp-tip-count', active.remaining === null ? '—' : String(active.remaining))
	const total = service.formatTotal(active.key)
	if (total) count.appendChild(createElement('span', 'bp-tip-total', ` / ${total}`))
	container.append(head, count)
	if (active.total !== null && active.remaining !== null) container.appendChild(createStatusBar(active.remaining, active.total, active.status))
	container.appendChild(createElement('div', 'bp-tip-sub', active.reset))
	const pace = service.formatPace(active.key)
	if (pace) container.appendChild(createElement('div', 'bp-tip-sub', pace))
	const notice = service.getNotice()
	if (notice) container.appendChild(createElement('div', 'bp-tip-notice', notice))
	container.appendChild(createElement('div', 'bp-tip-divider'))
	for (const key of LIMIT_KEYS) container.appendChild(createRow(LIMITS[key].label, formatCount(service, key), key === active.key))
	container.appendChild(createRow('Free queries', service.formatFreeQueries()))
	const updated = service.lastFetchedAt ? `Updated ${formatAgo(Date.now() - service.lastFetchedAt)}` : 'Waiting for usage data'
	container.appendChild(createElement('div', 'bp-tip-foot', `${updated} · Click for details`))
}
