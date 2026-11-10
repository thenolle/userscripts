import type { Tour } from '../tutorial/source'
import { info } from '../tutorial/steps'

export const createQuotaTour = (): Tour => ({
	id: 'quota-insights',
	title: 'Usage Quota V2',
	summary: 'Reported allowances and recovery calculations in the main usage dialog.',
	steps: [
		info(
			'One usage feature',
			'Open the header usage control. The observation engine is now integrated into this dialog rather than being a separate Quota Insights module.'
		),
		info(
			'Counts are not capacity',
			'A known remaining count is labelled Reported. The observed maximum is a lower bound; only an explicit API capacity supports a full-recovery scenario.'
		),
		info(
			'Recovery scenarios',
			'The same ledger supplies last net increase, net recovery rate, +1, +5 and recovery within your selected horizon when sufficient evidence exists.'
		),
		info(
			'Assumptions stay visible',
			'Rate scenarios assume no extra spending and an unchanged observed recovery rate. Unknown capacity and insufficient evidence remain explicitly unknown.'
		)
	]
})
