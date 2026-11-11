import type { Tour } from '../tutorial/source'
import { info } from '../tutorial/steps'

export const createQuotaTour = (): Tour => ({
	id: 'quota-insights',
	title: 'Usage Quota V2',
	summary: 'One card per limit, with refill and full-recovery times.',
	steps: [
		info('One card per limit', 'Each limit has its own card: remaining count, status, a meter and your last 24 hours.'),
		info('Colour and text', 'Green is OK, yellow is Warning, red is Critical or Empty. Every status also has a label and a symbol, so colour is never the only cue.'),
		info('Next +1, +5 and Full', 'These times use the API reset time when supplied, then your observed refill cadence, then your average recovery rate. The basis is shown under the times.'),
		info('Honest unknowns', 'Without a reported capacity, “Full” targets the highest level seen, and the card says so. Cards show Learning, Stale or Overdue instead of inventing a countdown.')
	]
})
