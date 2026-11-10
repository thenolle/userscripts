import { createElement, injectStyle } from '@nolly/core'
import type { QuotaReport } from '../quota'
import { uiConfig } from './config'
import { createDataRow, createNumberField } from './controls'
import { ensureUiStyles } from './styles'

export interface QuotaPanel {
	readonly element: HTMLElement
	refresh(): void
	destroy(): void
}

export const quotaDuration = (milliseconds: number): string => {
	if (!Number.isFinite(milliseconds)) return 'Unknown'
	const minutes = Math.max(0, Math.ceil(milliseconds / 60_000))
	if (minutes < 60) return `${minutes}m`
	const hours = Math.floor(minutes / 60)
	if (hours < 48) return `${hours}h ${minutes % 60}m`
	return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export const quotaSummary = (report: QuotaReport | null): string => {
	if (!report) return 'Collecting quota observations'
	if (Date.now() - report.observedAt > 5 * 60_000) return 'Last reported count · awaiting fresh observations'
	if (report.cap !== null && report.remaining >= report.cap) return 'At the API-reported capacity'
	const one = report.scenarios.find((scenario) => scenario.units === 1)
	if (one) return `+1 in ~${quotaDuration(one.estimatedMs)} · rate scenario`
	return report.lastIncrease ? `Last net recovery +${report.lastIncrease.units} · ${quotaDuration(Date.now() - report.lastIncrease.to)} ago` : `${report.observations} observations · learning recovery`
}

const CSS = `
.bp-quota-list { display: grid; gap: 18px; }
.bp-quota-card {
	padding: 18px;
	border: 1px solid var(--bp-border);
	border-radius: 10px;
	background: var(--bp-bg);
}
.bp-quota-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.bp-quota-head h3 { margin: 0; font-size: 14px; font-weight: 600; }
.bp-quota-count { margin: 14px 0 4px; font-size: 36px; line-height: 1.1; font-weight: 650; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
.bp-quota-caption { color: var(--bp-muted); font-size: 12px; line-height: 1.5; }
.bp-quota-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.bp-quota-metric { min-width: 0; padding: 12px; border: 1px solid var(--bp-border); border-radius: 8px; background: var(--bp-accent); }
.bp-quota-metric-label { color: var(--bp-muted); font-size: 11px; }
.bp-quota-metric-value { margin-top: 6px; font-size: 17px; line-height: 1.3; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.bp-quota-metric-note { margin-top: 5px; color: var(--bp-muted); font-size: 11px; line-height: 1.5; }
.bp-quota-horizon { margin-top: 10px; padding: 12px; border: 1px dashed var(--bp-border); border-radius: 8px; }
.bp-quota-evidence { margin-top: 12px; }
.bp-quota-evidence summary { cursor: pointer; color: var(--bp-muted); font-size: 12px; }
.bp-quota-evidence .bp-data-list { margin-top: 10px; }
.bp-quota-progress { height: 6px; margin-top: 12px; background: var(--bp-accent); border-radius: 999px; overflow: hidden; }
.bp-quota-progress > span { display: block; height: 100%; background: var(--bp-green); }
.bp-quota-card[data-state='empty'] .bp-quota-count { color: var(--bp-red); }
.bp-quota-card[data-state='low'] .bp-quota-count { color: var(--bp-yellow); }
@media (max-width: 560px) {
	.bp-quota-grid { grid-template-columns: 1fr; }
	.bp-quota-card { padding: 14px; }
}
`

const metric = (label: string, value: string, note: string): HTMLElement => {
	const card = createElement('div', 'bp-quota-metric')
	card.append(
		createElement('div', 'bp-quota-metric-label', label),
		createElement('div', 'bp-quota-metric-value', value),
		createElement('div', 'bp-quota-metric-note', note)
	)
	return card
}

const eta = (milliseconds: number, now: number): string => {
	const date = new Date(now + milliseconds)
	return Number.isFinite(date.getTime()) ? `Scenario time: ${date.toLocaleString()}` : 'Time exceeds the supported date range'
}

export const createQuotaPanel = (getReports: () => readonly QuotaReport[]): QuotaPanel => {
	ensureUiStyles()
	injectStyle(`${uiConfig().id}-quota-cards`, CSS)
	const element = createElement('div', 'bp-stack')
	element.dataset['usageQuotaV2'] = ''
	const results = createElement('div', 'bp-quota-list')
	const expanded = new Set<string>()
	let horizon = 60
	let destroyed = false
	const render = (): void => {
		if (destroyed) return
		const now = Date.now()
		const reports = getReports()
		if (!reports.length) {
			results.replaceChildren(createElement('div', 'bp-empty', 'Waiting for quota observations. Use the platform normally or refresh its usage data.'))
			return
		}
		results.replaceChildren(...reports.map((report) => {
			const identity = `${report.scope}:${report.key}`
			const stale = now - report.observedAt > 5 * 60_000
			const rateAvailable = !stale && report.recoveryPerHour !== null
			const missing = report.cap === null ? null : Math.max(0, report.cap - report.remaining)
			const state = stale ? 'stale' : report.remaining === 0 ? 'empty' : report.cap !== null && report.remaining / report.cap <= 0.1 ? 'low' : 'reported'
			const card = createElement('section', 'bp-quota-card')
			card.dataset['state'] = state
			const head = createElement('div', 'bp-quota-head')
			head.append(
				createElement('h3', undefined, report.label),
				createElement('span', `bp-badge ${state === 'empty' ? 'empty' : state === 'low' ? 'low' : ''}`, stale ? 'Last reported' : state === 'empty' ? 'Empty' : state === 'low' ? 'Low' : 'Reported')
			)
			card.append(
				head,
				createElement('div', 'bp-quota-count', report.remaining.toLocaleString()),
				createElement('div', 'bp-quota-caption', report.cap === null ? `remaining · capacity unknown · observed maximum ≥ ${report.peak}` : `remaining of ${report.cap} API-reported capacity`)
			)
			if (report.cap !== null && report.cap > 0) {
				const bar = createElement('div', 'bp-quota-progress')
				const fill = createElement('span')
				fill.style.width = `${Math.max(0, Math.min(100, report.remaining / report.cap * 100))}%`
				if (state === 'empty') fill.style.background = 'var(--bp-red)'
				if (state === 'low') fill.style.background = 'var(--bp-yellow)'
				bar.appendChild(fill)
				card.appendChild(bar)
			}
			const grid = createElement('div', 'bp-quota-grid')
			for (const units of [1, 5]) {
				const scenario = rateAvailable ? report.scenarios.find((entry) => entry.units === units) : null
				grid.appendChild(metric(
					`Recover +${units}`,
					scenario ? `~${quotaDuration(scenario.estimatedMs)}` : missing !== null && missing < units ? 'Not applicable' : stale ? 'Stale data' : 'Learning',
					scenario ? eta(scenario.estimatedMs, now) : missing !== null && missing < units ? 'Exceeds the missing allowance.' : 'More usable recovery observations are needed.'
				))
			}
			grid.appendChild(metric(
				'Full recovery',
				report.fullMs === 0 ? 'Full' : report.fullMs !== null && rateAvailable ? `~${quotaDuration(report.fullMs)}` : report.cap === null ? 'Cap unknown' : 'Learning',
				report.fullMs === 0 ? 'At the API-reported capacity.' : report.fullMs !== null && rateAvailable ? eta(report.fullMs, now) : 'Requires both capacity and usable recovery evidence.'
			))
			card.appendChild(grid)
			const horizonCard = createElement('div', 'bp-quota-horizon')
			const projected = rateAvailable ? report.recoveryPerHour! * horizon / 60 : null
			const bounded = projected === null ? null : missing === null ? projected : Math.min(missing, projected)
			horizonCard.append(
				createElement('div', 'bp-quota-metric-label', `Recovery within ${horizon} minutes`),
				createElement('div', 'bp-quota-metric-value', bounded === null ? 'Learning recovery rate' : `~${Math.max(0, bounded).toFixed(1)} units`),
				createElement('div', 'bp-quota-metric-note', report.recoveryPerHour !== null && !stale ? `Observed net recovery: ~${report.recoveryPerHour.toFixed(2)} units/hour.` : 'No unsupported countdown is substituted.')
			)
			card.appendChild(horizonCard)
			if (report.resetAt !== null) card.appendChild(createElement('p', 'bp-hint', `API-reported reset: ${new Date(report.resetAt).toLocaleString()}. The refill amount is not assumed.`))
			const details = createElement('details', 'bp-quota-evidence')
			details.open = expanded.has(identity)
			details.appendChild(createElement('summary', undefined, 'Observation evidence and assumptions'))
			const rows = createElement('div', 'bp-data-list')
			rows.append(
				createDataRow('Last observation', new Date(report.observedAt).toLocaleString()),
				createDataRow('Saved observations', String(report.observations)),
				createDataRow('Comparable sampling', quotaDuration(report.sampledMs)),
				createDataRow('Positive intervals', String(report.positiveIntervals)),
				createDataRow('Net recovered · sampled intervals', String(report.netRecovered)),
				createDataRow('Net spent · sampled intervals', String(report.netSpent))
			)
			if (report.lastIncrease) rows.appendChild(createDataRow('Last net increase', `+${report.lastIncrease.units} · ${quotaDuration(now - report.lastIncrease.to)} ago`))
			details.append(
				rows,
				createElement('p', 'bp-hint', 'Recovery times are conditional rate scenarios, not guaranteed refill events. They assume no further spending and an unchanged observed rate. Capacity is never inferred from a plateau.')
			)
			details.addEventListener('toggle', () => {
				if (!details.isConnected) return
				if (details.open) expanded.add(identity)
				else expanded.delete(identity)
			})
			card.appendChild(details)
			return card
		}))
	}
	const horizonControl = createNumberField({
		label: 'Recovery horizon · minutes',
		value: horizon,
		min: 1,
		max: 10_080,
		step: 1,
		onChange: (value) => {
			horizon = Math.round(value)
			render()
		}
	})
	element.append(
		horizonControl.wrapper,
		createElement('p', 'bp-hint', 'Recovery cards use the quota observation ledger. Unknown capacity, stale data and insufficient evidence remain explicit.'),
		results
	)
	const timer = window.setInterval(() => {
		if (element.isConnected) render()
	}, 15_000)
	render()
	return {
		element,
		refresh: render,
		destroy: () => {
			destroyed = true
			window.clearInterval(timer)
		}
	}
}
