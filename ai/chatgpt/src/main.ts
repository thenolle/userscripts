import { BatchRunnerFeature, CodeBlocksFeature, CommandPaletteFeature, DraftGuardFeature, EnterAsNewlineFeature, ExporterFeature, MaxWidthFeature, MessageSplitterFeature, PromptLibraryFeature, PromptQueueFeature, RecallFeature, SelectionToolbarFeature, UpdatesFeature, configurePlatform, configureUi, loadSplitterSettings } from '@nolly/ai'
import { App } from './app'
import { fileBudget } from './budget'
import { SPLITTER_DEFAULTS } from './config'
import { uiMarker } from './dom'
import { exportSource } from './export-source'
import { DiagnosticsFeature } from './features/diagnostics'
import { HeaderButtonFeature } from './features/header-button'
import { composerKit, generationKit, sendPrompt } from './kit'
import { logger } from './logger'
import { findAttachButton, findPrimaryAction, rejectEditable } from './locate'
import { SLUG, URLS } from './repo'
import { session } from './runtime'
import { storage } from './storage'
import { threadOf } from './threads'
import { installTheme } from './theme'

const onSend = (listener: () => void): (() => void) => session.subscribe((event) => { if (event === 'generation-start') listener() })

configureUi({
	id: 'better-chatgpt',
	title: 'Better ChatGPT',
	version: __VERSION__,
	marker: uiMarker,
	composerActions: () => ({ first: findAttachButton(), submit: findPrimaryAction()?.element ?? null })
})

configurePlatform({
	id: 'better-chatgpt',
	storage,
	logger,
	composer: composerKit,
	generation: generationKit,
	sendPrompt,
	onSend,
	threadOf,
	promptsUrl: URLS.prompts,
	exporter: exportSource,
	release: { name: 'Better ChatGPT', slug: SLUG, version: __VERSION__, metaUrl: URLS.meta, installUrl: URLS.install, releasesUrl: URLS.releases },
	codeBlockRoot: (pre) => pre.closest<HTMLElement>('[data-chatgpt-copy-code]') ?? pre.closest<HTMLElement>('[data-code-block]')
})

installTheme()

new App()
	.register((context) => new HeaderButtonFeature(context))
	.register((context) => new PromptLibraryFeature(context))
	.register((context) => new SelectionToolbarFeature(context))
	.register((context) => new MaxWidthFeature(context, { storage, sidebar: { rule: { id: 'left-sidebar', selector: 'aside' }, label: 'Left Sidebar', defaultRemoved: false } }))
	.register((context) => new CodeBlocksFeature(context))
	.register((context) => new EnterAsNewlineFeature(context, { storage, reject: rejectEditable, send: (editable) => void composerKit.sendComposer(editable) }))
	.register((context) => new MessageSplitterFeature(context, { storage, composer: composerKit, generation: generationKit, defaults: SPLITTER_DEFAULTS, attachBlocked: () => (fileBudget(session).remainingUploads === 0 ? 'No file uploads left until your limit resets.' : null) }))
	.register((context) => new BatchRunnerFeature(context))
	.register((context) => new DraftGuardFeature(context, { storage, composer: composerKit, onSend, tokenLimit: () => loadSplitterSettings(storage, SPLITTER_DEFAULTS).limit }))
	.register((context) => new CommandPaletteFeature(context))
	.register((context) => new PromptQueueFeature(context))
	.register((context) => new RecallFeature(context))
	.register((context) => new ExporterFeature(context))
	.register((context) => new UpdatesFeature(context))
	.register((context) => new DiagnosticsFeature(context))
	.start()
