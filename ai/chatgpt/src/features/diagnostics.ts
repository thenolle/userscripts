import { Feature, getPageWindow } from '@nolly/core'
import type { FeatureCommand } from '@nolly/core'
import { chatgptAdapter } from '../adapter'
import { sendPrompt } from '../kit'
import { session } from '../runtime'
import { fileBudget } from '../budget'

export class DiagnosticsFeature extends Feature {
	readonly id = 'diagnostics'
	readonly name = 'Diagnostics'
	readonly description = 'Adds betterChatgptDump() and betterChatgptSend(text) to the page console.'

	run(): void { }

	override onEnable(): void {
		const page = getPageWindow() as unknown as Record<string, unknown> | null
		if (page) {
			page['betterChatgptDump'] = () => this.dump()
			page['betterChatgptSend'] = (text: string) => sendPrompt(text)
		}
		this.context.logger.info('Diagnostics ready: betterChatgptDump() and betterChatgptSend(text).')
	}

	override commands(): FeatureCommand[] {
		return [{ id: 'diagnostics.dump', title: 'Dump page diagnostics', keywords: 'debug layout selectors session', run: () => this.context.logger.info(this.dump()) }]
	}

	private dump(): string {
		return JSON.stringify({ page: chatgptAdapter.describePage(), session: session.snapshot(), fileBudget: fileBudget(session) }, null, 2)
	}
}
