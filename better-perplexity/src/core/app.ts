import { Userscript } from '@nolly/core'
import { CONFIG, OBSERVER_OPTIONS } from '../config'
import { toggleSettingsDialog } from '../ui/settings-dialog'
import { uiMarker } from './dom'

export class App extends Userscript {
  constructor() {
    super({
      id: 'better-perplexity',
      name: 'Better Perplexity',
      version: __VERSION__,
      storage: { gmPrefix: '' },
      ui: uiMarker,
      observe: OBSERVER_OPTIONS,
      initializationDelay: CONFIG.initializationDelay,
      safetyInterval: CONFIG.safetyInterval,
      clearConsole: true,
      isReady: () => Boolean(document.querySelector('main')?.children.length),
      openSettings: (script) =>
        toggleSettingsDialog(script.getFeatures(), () => {
          script.refreshMenu()
          script.requestUpdate()
        })
    })
  }
}
