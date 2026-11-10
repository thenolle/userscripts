import { Feature, getPageWindow } from '@nolly/core'
import type { FeatureCommand, ScriptContext } from '@nolly/core'
import { chatgptAdapter } from '../adapter'
import type { ChatSession } from '../session'

export class DiagnosticsFeature extends Feature {
	readonly id = 'diagnostics'
	readonly name = 'Diagnostics'
	readonly description = 'Reports the detected ChatGPT layout and live session state in the console.'

	constructor(context: ScriptContext, private readonly session: ChatSession) {
		super(context)
	}

	run(): void { }

	override onEnable(): void {
		const page = getPageWindow() as unknown as Record<string, unknown> | null
		if (page) page['betterChatgptDump'] = () => this.dump()
		this.context.logger.info('Diagnostics ready. Run betterChatgptDump() in the console.')
	}

	override commands(): FeatureCommand[] {
		return [{ id: 'diagnostics.dump', title: 'Dump page diagnostics', keywords: 'debug layout selectors session', run: () => void this.context.logger.info(this.dump()) }]
	}

	private dump(): string {
		return JSON.stringify({ page: chatgptAdapter.describePage(), session: this.session.snapshot() }, null, 2)
	}
}
