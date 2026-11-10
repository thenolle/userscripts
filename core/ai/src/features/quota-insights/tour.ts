import type { Tour } from '../tutorial/source'
import { info } from '../tutorial/steps'

export const createQuotaTour = (): Tour => ({
	id: 'quota-insights',
	title: 'Quota insights',
	summary: 'Understand capacity evidence, observed recovery and conditional forecasts.',
	steps: [
		info('Open Quota Insights', 'Use Settings or the command palette to open Quota Insights. It reads observations gathered from platform usage responses.'),
		info('Maximum versus observed peak', 'An observed maximum is only a lower bound. Full-recovery scenarios require an explicit API capacity.'),
		info('Recovery evidence', 'Counter increases are net recovery. Spending between observations may hide additional refill, and long sampling gaps are excluded from rate calculations.'),
		info('Choose a horizon', 'Change the forecast horizon to inspect a conditional recovery scenario. +1, +5 and full recovery assume no new spending and a continuing observed rate.'),
		info('Unknown is useful', 'If evidence is insufficient, forecasts remain unavailable rather than displaying a confident but invented countdown.')
	]
})
