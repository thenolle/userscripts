import { Feature, createElement } from '@nolly/core'
import type { MenuEntry } from '@nolly/core'
import { QuotaLedger } from '../../quota'
import { storage } from '../../platform'
import { uiConfig } from '../../ui/config'
import { createButton, createDataRow, createNumberField, createSection } from '../../ui/controls'
import { createDialog } from '../../ui/dialog'

const duration = (ms: number): string => {
	const minutes = Math.max(0, Math.ceil(ms / 60_000))
	if (minutes < 60) return `${minutes}m`
	const hours = Math.floor(minutes / 60)
	if (hours < 48) return `${hours}h ${minutes % 60}m`
	return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export class QuotaInsightsFeature extends Feature {
	readonly id = 'quota-insights'
	readonly name = 'Quota Insights'
	readonly description = 'Inspect observed recovery, capacity evidence and conditional +1, +5 and full-recovery scenarios.'

	private readonly ledger = new QuotaLedger(storage)

	run(): void { }

	override menuEntries(): MenuEntry[] {
		return [{ id: 'open', label: 'Open Quota Insights', action: () => this.open() }]
	}

	private open(): void {
		const id = `${uiConfig().id}-quota-insights`
		const existing = document.getElementById(id)
		if (existing instanceof HTMLDialogElement) {
			existing.close()
			return
		}
		const ui = createDialog({ id, title: 'Quota insights', description: 'Observed counter changes and conditional recovery scenarios—not guaranteed refill schedules.', width: 720 })
		let horizon = 60
		const content = createElement('div', 'bp-stack')
		const render = (): void => {
			const reports = this.ledger.reports()
			content.replaceChildren()
			if (!reports.length) {
				content.appendChild(createElement('div', 'bp-empty', 'No observations yet. Use the platform normally; observations arrive with its usage responses.'))
				return
			}
			for (const report of reports) {
				const section = createSection(report.label)
				const rows = createElement('div', 'bp-data-list')
				rows.append(
					createDataRow('Remaining · last reported', String(report.remaining)),
					createDataRow('Observed', new Date(report.observedAt).toLocaleString()),
					createDataRow('Capacity', report.cap === null ? `Unknown · observed maximum ≥ ${report.peak}` : `${report.cap} · API-reported`),
					createDataRow('Stored observations', String(report.observations))
				)
				if (report.lastIncrease) rows.append(createDataRow('Last net increase', `+${report.lastIncrease.units}`), createDataRow('Increase observed', `${duration(Date.now() - report.lastIncrease.to)} ago · occurred within a ${duration(report.lastIncrease.to - report.lastIncrease.from)} observation interval`))
				rows.append(
					createDataRow('Comparable observation time', duration(report.sampledMs)),
					createDataRow('Observed net recovery', String(report.netRecovered)),
					createDataRow('Observed net spending', String(report.netSpent))
				)
				if (report.recoveryPerHour !== null) {
					rows.appendChild(createDataRow('Observed net recovery rate', `~${report.recoveryPerHour.toFixed(2)} units/hour`))
					for (const scenario of report.scenarios) rows.appendChild(createDataRow(`+${scenario.units} · rate scenario`, `~${duration(scenario.estimatedMs)}`))
					const projected = report.recoveryPerHour * horizon / 60
					const missing = report.cap === null ? null : report.cap - report.remaining
					const bounded = missing === null ? projected : Math.min(missing, projected)
					rows.appendChild(createDataRow(`Recovery in ${horizon}m · rate scenario`, `~${Math.max(0, bounded).toFixed(1)} units`))
				}
				rows.appendChild(createDataRow('Full recovery', report.fullMs === 0 ? 'At the API-reported cap' : report.fullMs === null ? 'Unknown · capacity or recovery evidence is insufficient' : `~${duration(report.fullMs)} · rate scenario`))
				if (report.resetAt !== null) rows.appendChild(createDataRow('API-reported reset', `${new Date(report.resetAt).toLocaleString()} · refill amount not assumed`))
				section.append(
					rows,
					createElement(
						'p',
						'bp-hint',
						report.recoveryPerHour === null ? 'Rate scenarios require at least 30 minutes of comparable sampling, three positive intervals and a recent observation. Long gaps and known cap-bound intervals are excluded.' : 'Scenarios assume the observed net recovery rate continues, with no additional spending. Hidden spending, batching, cap changes and activity in other clients can invalidate them.'
					)
				)
				content.appendChild(section)
			}
		}
		const minutes = createNumberField({
			label: 'Forecast horizon · minutes',
			value: horizon,
			min: 1,
			max: 10_080,
			onChange: (value) => {
				horizon = value
				render()
			}
		})
		ui.body.append(minutes.wrapper, content)
		ui.footer.append(
			createButton('Update view', { onClick: render }),
			createButton('Close', { primary: true, onClick: ui.close })
		)
		render()
		ui.show()
	}
}
