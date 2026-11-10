import { DraftGuardFeature, EnterAsNewlineFeature, configureUi } from '@nolly/ai'
import { App } from './core/app'
import { findComposer, writeComposer } from './core/composer'
import { uiMarker } from './core/dom'
import { fetchSpy } from './core/fetch-spy'
import { isAskRequest } from './core/requests'
import { storage } from './core/storage'
import { findComposerActions } from './locate'
import { BatchRunnerModule } from './modules/batch-runner'
import { CodeBlocksModule } from './modules/code-blocks'
import { CommandPaletteModule } from './modules/command-palette'
import { ExporterModule } from './modules/exporter'
import { GlobalSettingsModule } from './modules/global-settings'
import { MaxWidthModule } from './modules/max-width'
import { MessageSplitterModule } from './modules/message-splitter'
import { loadSplitterSettings } from './modules/message-splitter/settings'
import { PromptLibraryModule } from './modules/prompt-library'
import { PromptQueueModule } from './modules/prompt-queue'
import { RecallModule } from './modules/recall'
import { SelectionToolbarModule } from './modules/selection-toolbar'
import { TutorialModule } from './modules/tutorial'
import { UpdatesModule } from './modules/updates'
import { UsageStatusModule } from './modules/usage-status'

configureUi({ id: 'better-perplexity', title: 'Better Perplexity', version: __VERSION__, marker: uiMarker, composerActions: findComposerActions })
fetchSpy.install()

new App()
	.register((context) => new PromptLibraryModule(context))
	.register((context) => new SelectionToolbarModule(context))
	.register((context) => new MaxWidthModule(context))
	.register((context) => new EnterAsNewlineFeature(context, { storage }))
	.register((context) => new CodeBlocksModule(context))
	.register((context) => new MessageSplitterModule(context))
	.register((context) => new BatchRunnerModule(context))
	.register((context) => new DraftGuardFeature(context, { storage, composer: { findComposer, writeComposer }, onSend: (listener) => fetchSpy.subscribe(({ method, url }) => { if (isAskRequest(method, url)) listener() }), tokenLimit: () => loadSplitterSettings().limit }))
	.register((context) => new CommandPaletteModule(context))
	.register((context) => new ExporterModule(context))
	.register((context) => new UsageStatusModule(context))
	.register((context) => new GlobalSettingsModule(context))
	.register((context) => new TutorialModule(context))
	.register((context) => new UpdatesModule(context))
	.register((context) => new PromptQueueModule(context))
	.register((context) => new RecallModule(context))
	.start()
