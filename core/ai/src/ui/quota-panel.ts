import { createElement, injectStyle } from '@nolly/core'
import { LEVEL_GLYPH, LEVEL_LABEL, QUOTA_STALE_MS } from '../quota'
import type { Forecast, QuotaReport } from '../quota'
import { uiConfig } from './config'
import { createDataRow } from './controls'
import { ensureUiStyles } from './styles'

export interface QuotaPanelOptions {
	readonly activeKey?: () => string | null
}

export interface QuotaPanel {
	readonly element: HTMLElement
	refresh(): void
	destroy(): void
}

const CSS = `
.bp-qc-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; }
.bp-qc {
	--qc: var(--bp-muted);
	display: flex;
	flex-direction: column;
	gap: 14px;
	min-width: 0;
	padding: 16px;
	border: 1px solid var(--bp-border);
	border-inline-start: 4px solid var(--qc);
	border-radius: 12px;
	background: var(--bp-bg);
	color: var(--bp-fg);
}
.bp-qc[data-level='ok'] { --qc: var(--bp-green); }
.bp-qc[data-level='warning'] { --qc: var(--bp-yellow); }
.bp-qc[data-level='critical'], .bp-qc[data-level='empty'] { --qc: var(--bp-red); }
.bp-qc[data-active='true'] { box-shadow: 0 0 0 2px color-mix(in srgb, var(--qc) 35%, transparent); }
.bp-qc-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.bp-qc-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.bp-qc-title h3 { margin: 0; overflow: hidden; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.bp-qc-now { padding: 1px 6px; border-radius: 999px; background: var(--bp-accent); color: var(--bp-muted); font-size: 10px; }
.bp-qc-pill {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 3px 9px;
	border: 1px solid color-mix(in srgb, var(--qc) 45%, transparent);
	border-radius: 999px;
	background: color-mix(in srgb, var(--qc) 14%, var(--bp-bg));
	color: var(--bp-fg);
	font-size: 11px;
	font-weight: 600;
	white-space: nowrap;
}
.bp-qc-glyph { display: inline-grid; place-items: center; width: 14px; height: 14px; border-radius: 50%; background: var(--qc); color: #fff; font-size: 10px; line-height: 1; }
.bp-qc[data-level='warning'] .bp-qc-glyph { color: #1f1300; }
.bp-qc-count { font-size: 38px; font-weight: 650; line-height: 1; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
.bp-qc-of { margin-inline-start: 6px; color: var(--bp-muted); font-size: 15px; font-weight: 400; letter-spacing: 0; }
.bp-qc-sub { margin-top: 6px; color: var(--bp-muted); font-size: 12px; line-height: 1.5; }
.bp-qc-meter { height: 8px; overflow: hidden; border-radius: 999px; background: var(--bp-accent); }
.bp-qc-meter > span { display: block; height: 100%; border-radius: inherit; background: var(--qc); transition: width 240ms ease; }
.bp-qc-times { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.bp-qc-time { min-width: 0; padding: 10px; border: 1px solid var(--bp-border); border-radius: 10px; background: var(--bp-accent); }
.bp-qc-time[data-tone='good'] { border-color: color-mix(in srgb, var(--bp-green) 45%, var(--bp-border)); }
.bp-qc-time-label { color: var(--bp-muted); font-size: 11px; }
.bp-qc-time-main { margin-top: 4px; font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.bp-qc-time-note { margin-top: 3px; color: var(--bp-muted); font-size: 11px; line-height: 1.4; }
.bp-qc-basis { color: var(--bp-muted); font-size: 11px; line-height: 1.5; }
.bp-qc-spark { display: block; width: 100%; height: 34px; color: var(--qc); }
.bp-qc-more summary { cursor: pointer; color: var(--bp-muted); font-size: 12px; }
.bp-qc-more .bp-data-list { margin-top: 8px; }
.bp-qc-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; padding: 12px 14px; border: 1px solid var(--bp-border); border-radius: 12px; background: var(--bp-accent); font-size: 12px; }
.bp-qc-summary .bp-qc { padding: 0; border: 0; background: transparent; }
@media (max-width: 560px) { .bp-qc-times { grid-template-columns: 1fr; } .bp-qc-list { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .bp-qc-meter > span { transition: none; } }
`

export const quotaDuration = (milliseconds: number): string => {
	if (!Number.isFinite(milliseconds)) return 'unknown'
	const total = Math.max(0, Math.ceil(milliseconds / 60_000))
	if (total < 60) return `${total}m`
	const hours = Math.floor(total / 60)
	if (hours < 48) return `${hours}h ${String(total % 60).padStart(2, '0')}m`
	return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

const clock = (at: number, now: number): string => {
	const date = new Date(at)
	const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	return date.toDateString() === new Date(now).toDateString() ? time : `${date.toLocaleDateString([], { weekday: 'short' })} ${time}`
}

const marginOf = (forecast: Forecast, at: number, now: number): number => forecast.marginMs + forecast.relativeError * Math.max(0, at - now)

interface Cell {
	readonly main: string
	readonly note: string
	readonly good?: boolean
}

const etaCell = (forecast: Forecast, at: number, now: number): Cell => {
	const margin = marginOf(forecast, at, now)
	const wait = at - now
	return {
		main: wait <= 30_000 ? 'any moment' : `in ${quotaDuration(wait)}`,
		note: `≈ ${clock(at, now)}${margin >= 60_000 ? ` ± ${quotaDuration(margin)}` : ''}`
	}
}

const cellsOf = (report: QuotaReport, now: number): readonly [Cell, Cell, Cell] => {
	const stale = now - report.observedAt > QUOTA_STALE_MS
	const missing = report.target === null ? null : Math.max(0, report.target - report.remaining)
	const forecast = report.forecast
	const learning: Cell = { main: 'Learning', note: 'Needs about 30 minutes of sampling and 3 observed refills.' }
	const state = (): Cell | null => {
		if (missing === 0) return { main: 'Full', note: report.targetKind === 'observed-peak' ? 'At the highest level seen.' : 'At the reported capacity.', good: true }
		if (stale) return { main: 'Stale', note: 'Waiting for fresh data.' }
		if (forecast?.overdue) return { main: 'Overdue', note: 'No increase at the usual time.' }
		return null
	}
	const blocked = state()
	const unit = (units: number): Cell => {
		if (blocked) return blocked
		if (missing !== null && missing < units) return { main: '—', note: 'More than the missing amount.' }
		const entry = forecast?.plus.find((item) => item.units === units)
		if (forecast && entry) return etaCell(forecast, entry.at, now)
		if (forecast?.source === 'api-reset') return { main: 'Unknown', note: 'The API gives a reset time, not the amount.' }
		return learning
	}
	const full = (): Cell => {
		if (blocked) return blocked
		if (forecast && forecast.fullAt !== null) return etaCell(forecast, forecast.fullAt, now)
		if (report.target === null) return { main: 'Unknown', note: 'No capacity reported and no higher level seen yet.' }
		return forecast?.source === 'api-reset' ? { main: 'Unknown', note: 'Refill amount not reported.' } : learning
	}
	return [unit(1), unit(5), full()]
}

export const quotaSummary = (report: QuotaReport | null): string => {
	if (!report) return 'Collecting quota observations'
	const now = Date.now()
	if (now - report.observedAt > QUOTA_STALE_MS) return 'Last reported · waiting for fresh data'
	if (report.target !== null && report.remaining >= report.target) return 'Full'
	const forecast = report.forecast
	if (forecast?.nextAt != null) {
		const next = `Next +1 ${forecast.nextAt - now <= 30_000 ? 'any moment' : `in ${quotaDuration(forecast.nextAt - now)}`}`
		return forecast.fullAt !== null ? `${next} · Full in ${quotaDuration(forecast.fullAt - now)}` : next
	}
	return forecast?.overdue ? 'Refill overdue · waiting for an increase' : 'Learning refill pattern'
}

const cell = (label: string, content: Cell): HTMLElement => {
	const element = createElement('div', 'bp-qc-time')
	if (content.good) element.dataset['tone'] = 'good'
	element.append(createElement('div', 'bp-qc-time-label', label), createElement('div', 'bp-qc-time-main', content.main), createElement('div', 'bp-qc-time-note', content.note))
	return element
}

const sparkline = (report: QuotaReport): SVGSVGElement | null => {
	if (report.history.length < 2) return null
	const ns = 'http://www.w3.org/2000/svg'
	const first = report.history[0]!
	const last = report.history.at(-1)!
	const span = Math.max(1, last[0] - first[0])
	const top = Math.max(1, report.target ?? 0, report.peak)
	const points = report.history.map(([at, value]) => `${(((at - first[0]) / span) * 100).toFixed(2)},${(30 - (value / top) * 28).toFixed(2)}`).join(' ')
	const svg = document.createElementNS(ns, 'svg')
	svg.setAttribute('viewBox', '0 0 100 32')
	svg.setAttribute('preserveAspectRatio', 'none')
	svg.setAttribute('aria-hidden', 'true')
	svg.setAttribute('class', 'bp-qc-spark')
	const line = document.createElementNS(ns, 'polyline')
	for (const [name, value] of Object.entries({ points, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' })) line.setAttribute(name, value)
	svg.appendChild(line)
	return svg
}

const buildCard = (report: QuotaReport, now: number, active: boolean, expanded: Set<string>): HTMLElement => {
	const id = `${report.scope}:${report.key}`
	const stale = now - report.observedAt > QUOTA_STALE_MS
	const card = createElement('section', 'bp-qc')
	card.dataset['level'] = report.level
	card.dataset['active'] = String(active)
	const title = createElement('div', 'bp-qc-title')
	title.appendChild(createElement('h3', undefined, report.label))
	if (active) title.appendChild(createElement('span', 'bp-qc-now', 'Selected'))
	const pill = createElement('span', 'bp-qc-pill')
	pill.append(createElement('span', 'bp-qc-glyph', LEVEL_GLYPH[report.level]), document.createTextNode(LEVEL_LABEL[report.level]))
	const head = createElement('div', 'bp-qc-head')
	head.append(title, pill)
	const count = createElement('div', 'bp-qc-count', report.remaining.toLocaleString())
	if (report.cap !== null) count.appendChild(createElement('span', 'bp-qc-of', `/ ${report.cap}`))
	const basis = report.cap !== null ? 'API-reported capacity' : report.peak > report.remaining ? `capacity not reported · highest seen ${report.peak}` : 'capacity not reported'
	const age = stale ? ` · last reported ${quotaDuration(now - report.observedAt)} ago` : ''
	const main = createElement('div')
	main.append(count, createElement('div', 'bp-qc-sub', `remaining · ${basis}${age}`))
	card.append(head, main)
	if (report.target !== null) {
		const percent = Math.max(0, Math.min(100, report.remaining / report.target * 100))
		const meter = createElement('div', 'bp-qc-meter')
		meter.setAttribute('role', 'meter')
		meter.setAttribute('aria-label', `${report.label} remaining`)
		meter.setAttribute('aria-valuemin', '0')
		meter.setAttribute('aria-valuemax', String(report.target))
		meter.setAttribute('aria-valuenow', String(report.remaining))
		const fill = createElement('span')
		fill.style.width = `${percent.toFixed(1)}%`
		meter.appendChild(fill)
		card.appendChild(meter)
	}
	const [one, five, full] = cellsOf(report, now)
	const grid = createElement('div', 'bp-qc-times')
	grid.append(cell('Next +1', one), cell('+5 back', five), cell(report.target === null ? 'Fully refilled' : `Full (${report.target})`, full))
	card.appendChild(grid)
	if (report.forecast && !stale) card.appendChild(createElement('div', 'bp-qc-basis', `Basis: ${report.forecast.basis}`))
	const spark = sparkline(report)
	if (spark) card.appendChild(spark)
	const details = createElement('details', 'bp-qc-more')
	details.open = expanded.has(id)
	details.appendChild(createElement('summary', undefined, 'Evidence and assumptions'))
	const rows = createElement('div', 'bp-data-list')
	rows.append(
		createDataRow('Last observation', new Date(report.observedAt).toLocaleString()),
		createDataRow('Saved observations', String(report.observations)),
		createDataRow('Comparable sampling', quotaDuration(report.sampledMs)),
		createDataRow('Refill intervals seen', String(report.positiveIntervals)),
		createDataRow('Recovered · spent (sampled)', `${report.netRecovered} · ${report.netSpent}`),
		createDataRow('API reset time', report.resetAt === null ? 'Not supplied' : new Date(report.resetAt).toLocaleString())
	)
	if (report.lastIncrease) rows.appendChild(createDataRow('Last increase', `+${report.lastIncrease.units} · ${quotaDuration(now - report.lastIncrease.to)} ago`))
	details.append(rows, createElement('p', 'bp-hint', 'Times are estimates from this device’s observations. They assume no extra spending. “Full” targets the API capacity, or the highest level seen when no capacity is reported.'))
	details.addEventListener('toggle', () => {
		if (details.open) expanded.add(id)
		else expanded.delete(id)
	})
	card.appendChild(details)
	return card
}

export const createQuotaPanel = (getReports: () => readonly QuotaReport[], options: QuotaPanelOptions = {}): QuotaPanel => {
	ensureUiStyles()
	injectStyle(`${uiConfig().id}-quota-cards-v3`, CSS)
	const element = createElement('div', 'bp-qc-list')
	element.dataset['usageQuotaV2'] = ''
	const expanded = new Set<string>()
	let destroyed = false
	const render = (): void => {
		if (destroyed) return
		const now = Date.now()
		const activeKey = options.activeKey?.() ?? null
		const reports = [...getReports()].sort((a, b) => Number(b.key === activeKey) - Number(a.key === activeKey))
		if (!reports.length) {
			element.replaceChildren(createElement('div', 'bp-empty', 'Waiting for quota observations. Use the site normally or refresh usage data.'))
			return
		}
		element.replaceChildren(...reports.map((report) => buildCard(report, now, report.key === activeKey, expanded)))
	}
	const timer = window.setInterval(() => {
		if (element.isConnected) render()
	}, 10_000)
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
