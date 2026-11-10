import { DraftGuardFeature, EnterAsNewlineFeature, MessageSplitterFeature, configureUi, loadSplitterSettings } from '@nolly/ai'
import { App } from './app'
import { fileBudget } from './budget'
import { SPLITTER_DEFAULTS } from './config'
import { uiMarker } from './dom'
import { DiagnosticsFeature } from './features/diagnostics'
import { HeaderButtonFeature } from './features/header-button'
import { composerKit, generationKit } from './kit'
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
	.register((context) => new MessageSplitterFeature(context, { storage: context.storage, composer: composerKit, generation: generationKit, defaults: SPLITTER_DEFAULTS, attachBlocked: () => (fileBudget(session).remainingUploads === 0 ? 'No file uploads left until your limit resets.' : null) }))
	.register((context) => new DraftGuardFeature(context, { storage: context.storage, composer: composerKit, onSend: (listener) => session.subscribe((event) => { if (event === 'generation-start') listener() }), tokenLimit: () => loadSplitterSettings(context.storage, SPLITTER_DEFAULTS).limit }))
	.register((context) => new DiagnosticsFeature(context))
	.start()
