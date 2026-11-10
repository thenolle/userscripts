import { createElement } from '@nolly/core'
import type { QuotaReport } from '../quota'
import { createDataRow, createNumberField, createSection } from './controls'
import { ensureUiStyles } from './styles'

export interface QuotaPanel {
	readonly element: HTMLElement
	refresh(): void
	destroy(): void
}

export const quotaDuration = (milliseconds: number): string => {
	const minutes = Math.max(0, Math.ceil(milliseconds / 60_000))
	if (minutes < 60) return `${minutes}m`
	const hours = Math.floor(minutes / 60)
	if (hours < 48) return `${hours}h ${minutes % 60}m`
	return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export const quotaSummary = (report: QuotaReport | null): string => {
	if (!report) return 'Collecting quota observations'
	const now = Date.now()
	if (now - report.observedAt > 5 * 60_000) return 'Last reported count · waiting for fresh observations'
	if (report.cap !== null && report.remaining >= report.cap) return 'At the API-reported capacity'
	const one = report.scenarios.find((scenario) => scenario.units === 1)
	if (one) return `+1 in ~${quotaDuration(one.estimatedMs)} · rate scenario`
	if (report.lastIncrease) return `Last net recovery +${report.lastIncrease.units} · ${quotaDuration(now - report.lastIncrease.to)} ago`
	return `${report.observations} observations · recovery not measured yet`
}

export const createQuotaPanel = (getReports: () => readonly QuotaReport[]): QuotaPanel => {
	ensureUiStyles()
	const element = createElement('div', 'bp-stack')
	element.dataset['usageQuotaV2'] = ''
	const results = createElement('div', 'bp-stack')
	let horizon = 60
	let destroyed = false
	const render = (): void => {
		if (destroyed) return
		const reports = getReports()
		if (!reports.length) {
			results.replaceChildren(createElement('div', 'bp-empty', 'No observations for the current account scope yet. Platform usage responses will populate this view.'))
			return
		}
		results.replaceChildren(...reports.map((report) => {
			const section = createSection(report.label)
			const rows = createElement('div', 'bp-data-list')
			const stale = Date.now() - report.observedAt > 5 * 60_000
			const availableClass = report.remaining === 0 ? 'negative' : stale ? '' : 'positive'
			rows.append(
				createDataRow(stale ? 'Remaining · last reported' : 'Remaining · reported', String(report.remaining), availableClass),
				createDataRow('Capacity', report.cap === null ? `Unknown · observed maximum ≥ ${report.peak}` : `${report.cap} · API-reported`),
				createDataRow('Last observation', new Date(report.observedAt).toLocaleString()),
				createDataRow('Saved observations', String(report.observations)),
				createDataRow('Comparable sampling', quotaDuration(report.sampledMs)),
				createDataRow('Net recovered · sampled intervals', String(report.netRecovered)),
				createDataRow('Net spent · sampled intervals', String(report.netSpent))
			)
			if (report.lastIncrease) {
				rows.append(
					createDataRow('Last observed net increase', `+${report.lastIncrease.units} · ${quotaDuration(Date.now() - report.lastIncrease.to)} ago`),
					createDataRow('Increase timing uncertainty', `Within a ${quotaDuration(report.lastIncrease.to - report.lastIncrease.from)} observation interval`)
				)
			}
			if (report.recoveryPerHour !== null && !stale) {
				rows.appendChild(createDataRow('Observed net recovery rate', `~${report.recoveryPerHour.toFixed(2)} units/hour`))
				for (const target of [1, 5]) {
					const scenario = report.scenarios.find((entry) => entry.units === target)
					rows.appendChild(createDataRow(`Recover +${target} · rate scenario`, scenario ? `~${quotaDuration(scenario.estimatedMs)}` : report.cap !== null && report.cap - report.remaining < target ? 'Exceeds the missing allowance' : 'Not enough evidence'))
				}
				const missing = report.cap === null ? null : Math.max(0, report.cap - report.remaining)
				const projected = report.recoveryPerHour * horizon / 60
				rows.appendChild(createDataRow(`Recovery within ${horizon}m · rate scenario`, `~${(missing === null ? projected : Math.min(missing, projected)).toFixed(1)} units`))
			}
			rows.appendChild(createDataRow('Full recovery', report.fullMs === 0 ? 'At the API-reported capacity' : report.fullMs !== null && !stale ? `~${quotaDuration(report.fullMs)} · rate scenario` : 'Unknown · capacity or recovery evidence is insufficient'))
			if (report.resetAt !== null) rows.appendChild(createDataRow('API-reported reset', `${new Date(report.resetAt).toLocaleString()} · amount not assumed`))
			section.append(rows, createElement('p', 'bp-hint', report.recoveryPerHour === null ? 'Recovery scenarios require 30 minutes of comparable sampling, three positive intervals and a recent observation. Long gaps and known cap-bound intervals are excluded.' : 'Rate scenarios assume no additional spending and an unchanged observed rate. Hidden spending, batched resets and activity in other clients can invalidate them.'))
			return section
		}))
	}
	const control = createNumberField({
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
		control.wrapper,
		createElement('p', 'bp-hint', 'A counter increase is net recovery, not proof of the complete refill amount. An observed maximum is a lower bound—not a verified capacity.'),
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
