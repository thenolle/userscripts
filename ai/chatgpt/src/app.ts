import { toggleSettingsDialog } from '@nolly/ai'
import { Userscript } from '@nolly/core'
import { CONFIG, OBSERVER_OPTIONS } from './config'
import { uiMarker } from './dom'

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
      openSettings: (script) =>
        toggleSettingsDialog(script.getFeatures(), () => {
          script.refreshMenu()
          script.requestUpdate()
        })
    })
  }
}
