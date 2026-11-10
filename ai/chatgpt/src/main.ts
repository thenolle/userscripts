import { DraftGuardFeature, EnterAsNewlineFeature, configureUi } from '@nolly/ai'
import { App } from './app'
import { MESSAGE_TOKEN_LIMIT } from './config'
import { uiMarker } from './dom'
import { DiagnosticsFeature } from './features/diagnostics'
import { HeaderButtonFeature } from './features/header-button'
import { composerKit } from './kit'
import { findAttachButton, findPrimaryAction, rejectEditable } from './locate'
import { session } from './runtime'
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
	.register((context) => new EnterAsNewlineFeature(context, { storage: context.storage, reject: rejectEditable, send: (editable) => void composerKit.sendComposer(editable) }))
	.register((context) => new DraftGuardFeature(context, { storage: context.storage, composer: composerKit, onSend: (listener) => session.subscribe((event) => { if (event === 'generation-start') listener() }), tokenLimit: () => MESSAGE_TOKEN_LIMIT }))
	.register((context) => new DiagnosticsFeature(context))
	.start()
