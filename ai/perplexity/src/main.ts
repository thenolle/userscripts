import {
  BatchRunnerFeature,
  CodeBlocksFeature,
  CommandPaletteFeature,
  ContextPacksFeature,
  DraftGuardFeature,
  EnterAsNewlineFeature,
  ExporterFeature,
  MaxWidthFeature,
  MessageSplitterFeature,
  PromptLibraryFeature,
  PromptQueueFeature,
  RecallFeature,
  SelectionToolbarFeature,
  TutorialFeature,
  UpdatesFeature,
  configurePlatform,
  configureUi
} from '@nolly/ai'
import { App } from './core/app'
import { composerKit } from './core/composer'
import { sendPrompt } from './core/dispatch'
import { uiMarker } from './core/dom'
import { fetchSpy } from './core/fetch-spy'
import { generationKit } from './core/generation'
import { logger } from './core/logger'
import { isAskRequest } from './core/requests'
import { storage } from './core/storage'
import { threadOf } from './core/threads'
import { exportSource } from './export-source'
import { findComposerActions } from './locate'
import { GlobalSettingsModule } from './modules/global-settings'
import { ALWAYS_HIDDEN, LAYOUT_RULES, RIGHT_SIDEBAR } from './modules/max-width/rules'
import { UsageStatusModule } from './modules/usage-status'
import { URLS } from './repo'
import { tutorialSource } from './tutorial-source'

const onSend = (listener: () => void): (() => void) =>
  fetchSpy.subscribe(({ method, url }) => {
    if (isAskRequest(method, url)) listener()
  })

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
  promptsUrl: URLS.prompts,
  exporter: exportSource,
  release: { name: 'Better Perplexity', slug: 'better-perplexity', version: __VERSION__, metaUrl: URLS.meta, installUrl: URLS.install, releasesUrl: URLS.releases },
  tutorial: tutorialSource
})
fetchSpy.install()

new App()
  .register((context) => new PromptLibraryFeature(context))
  .register((context) => new SelectionToolbarFeature(context))
  .register((context) => new MaxWidthFeature(context, { storage, hidden: ALWAYS_HIDDEN, layout: LAYOUT_RULES, sidebar: { rule: RIGHT_SIDEBAR, label: 'Right Sidebar', defaultRemoved: true } }))
  .register((context) => new EnterAsNewlineFeature(context))
  .register((context) => new CodeBlocksFeature(context))
  .register((context) => new MessageSplitterFeature(context))
  .register((context) => new BatchRunnerFeature(context))
  .register((context) => new DraftGuardFeature(context))
  .register((context) => new CommandPaletteFeature(context))
  .register((context) => new ExporterFeature(context))
  .register((context) => new UsageStatusModule(context))
  .register((context) => new GlobalSettingsModule(context))
  .register((context) => new TutorialFeature(context))
  .register((context) => new UpdatesFeature(context))
  .register((context) => new PromptQueueFeature(context))
  .register((context) => new RecallFeature(context))
  .register((context) => new ContextPacksFeature(context))
  .start()
