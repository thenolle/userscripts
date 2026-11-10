import type { Tour } from '../tutorial/source'
import { click, closed, find, info, point, wait } from '../tutorial/steps'
import { uiConfig } from '../../ui/config'

export const createAnswerDiffTour = (): Tour => ({
	id: 'answer-diff',
	title: 'Answer diff',
	summary: 'See exact changes between two responses or code revisions.',
	get steps() {
		const id = `${uiConfig().id}-answer-diff`
		return [
			info('Compare revisions, not confidence', 'Answer Diff highlights text changes. It does not score truth, quality or safety. Select an answer before opening, or paste both versions.'),
			click('Open Answer Diff', 'Click the composer tool labelled Answer diff.', find('.bp-cb-diff')),
			point('Choose both versions', 'Paste the original into Baseline and the new answer into Revision. A previously saved baseline loads automatically.', find(`#${id} [data-diff-editors]`)),
			point('Review exact changes', 'Compare shows added, removed and unchanged lines. Large changed regions use a clearly labelled coarse fallback.', find(`#${id} [data-diff-output]`)),
			info('Persistence is explicit', 'Only Save baseline persists text. It remains local to this userscript, including text saved from temporary chats. Copy or paste manually to compare across platforms.'),
			wait('Close without sending', 'Close the dialog. No comparison action sends a message.', closed(id))
		]
	}
})
