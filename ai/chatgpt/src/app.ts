import { Userscript, createLogger } from '@nolly/core'
import { CONFIG, OBSERVER_OPTIONS } from './config'
import { uiMarker } from './dom'

const logger = createLogger('better-chatgpt')

export class App extends Userscript {
	constructor() {
		super({
			id: 'better-chatgpt',
			name: 'Better ChatGPT',
			version: __VERSION__,
			storage: { gmPrefix: '' },
			ui: uiMarker,
			observe: OBSERVER_OPTIONS,
			initializationDelay: CONFIG.initializationDelay,
			safetyInterval: CONFIG.safetyInterval,
			clearConsole: false,
			isReady: () => Boolean(document.querySelector('main')),
			openSettings: () => logger.info('The settings dialog arrives in step 2.')
		})
	}
}
