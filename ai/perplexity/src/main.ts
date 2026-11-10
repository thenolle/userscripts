import { CommandPaletteFeature, DraftGuardFeature, EnterAsNewlineFeature, MessageSplitterFeature, PromptLibraryFeature, PromptQueueFeature, RecallFeature, configurePlatform, configureUi, loadSplitterSettings } from '@nolly/ai'
import { App } from './core/app'
import { composerKit, findComposer, writeComposer } from './core/composer'
import { sendPrompt } from './core/dispatch'
import { uiMarker } from './core/dom'
import { fetchSpy } from './core/fetch-spy'
import { generationKit } from './core/generation'
import { logger } from './core/logger'
import { isAskRequest } from './core/requests'
import { storage } from './core/storage'
import { threadOf } from './core/threads'
import { findComposerActions } from './locate'
import { BatchRunnerModule } from './modules/batch-runner'
import { CodeBlocksModule } from './modules/code-blocks'
import { ExporterModule } from './modules/exporter'
import { GlobalSettingsModule } from './modules/global-settings'
import { MaxWidthModule } from './modules/max-width'
import { SelectionToolbarModule } from './modules/selection-toolbar'
import { TutorialModule } from './modules/tutorial'
import { UpdatesModule } from './modules/updates'
import { UsageStatusModule } from './modules/usage-status'
import { URLS } from './repo'

const onSend = (listener: () => void): (() => void) => fetchSpy.subscribe(({ method, url }) => { if (isAskRequest(method, url)) listener() })

configureUi({ id: 'better-perplexity', title: 'Better Perplexity', version: __VERSION__, marker: uiMarker, composerActions: findComposerActions })
configurePlatform({
	id: 'better-perplexity',
	storage,
	logger,
	composer: composerKit,
	generation: generationKit,
	sendPrompt,
	onSend,
	threadOf,
	promptsUrl: URLS.prompts
})
fetchSpy.install()

new App()
	.register((context) => new PromptLibraryFeature(context))
	.register((context) => new SelectionToolbarModule(context))
	.register((context) => new MaxWidthModule(context))
	.register((context) => new EnterAsNewlineFeature(context, { storage }))
	.register((context) => new CodeBlocksModule(context))
	.register((context) => new MessageSplitterFeature(context, { storage, composer: composerKit, generation: generationKit }))
	.register((context) => new BatchRunnerModule(context))
	.register((context) => new DraftGuardFeature(context, { storage, composer: { findComposer, writeComposer }, onSend, tokenLimit: () => loadSplitterSettings(storage).limit }))
	.register((context) => new CommandPaletteFeature(context))
	.register((context) => new ExporterModule(context))
	.register((context) => new UsageStatusModule(context))
	.register((context) => new GlobalSettingsModule(context))
	.register((context) => new TutorialModule(context))
	.register((context) => new UpdatesModule(context))
	.register((context) => new PromptQueueFeature(context))
	.register((context) => new RecallFeature(context))
	.start()
