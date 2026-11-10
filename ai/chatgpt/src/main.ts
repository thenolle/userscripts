import { configureUi } from '@nolly/ai'
import { App } from './app'
import { uiMarker } from './dom'
import { DiagnosticsFeature } from './features/diagnostics'
import { HeaderButtonFeature } from './features/header-button'
import { findAttachButton, findPrimaryAction } from './locate'
import './runtime'
import { installTheme } from './theme'

configureUi({
	id: 'better-chatgpt',
	title: 'Better ChatGPT',
	version: __VERSION__,
	marker: uiMarker,
	composerActions: () => ({ first: findAttachButton(), submit: findPrimaryAction()?.element ?? null })
})

installTheme()

new App()
	.register((context) => new HeaderButtonFeature(context))
	.register((context) => new DiagnosticsFeature(context))
	.start()
