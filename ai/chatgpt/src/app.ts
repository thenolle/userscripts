import { toggleSettingsDialog } from '@nolly/ai'
import { Userscript } from '@nolly/core'
import { CONFIG, OBSERVER_OPTIONS } from './config'
import { uiMarker } from './dom'
import { findComposerForm } from './locate'

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
      isReady: () => document.readyState === 'complete' && findComposerForm() !== null,
      openSettings: (script) =>
        toggleSettingsDialog(script.getFeatures(), () => {
          script.refreshMenu()
          script.requestUpdate()
        })
    })
  }
}
