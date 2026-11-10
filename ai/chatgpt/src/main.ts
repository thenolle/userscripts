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
import { App } from './app'
import { fileBudget } from './budget'
import { SPLITTER_DEFAULTS } from './config'
import { uiMarker } from './dom'
import { exportSource } from './export-source'
import { DiagnosticsFeature } from './features/diagnostics'
import { HeaderButtonFeature } from './features/header-button'
import { UsageFeature } from './features/usage'
import { composerKit, generationKit, sendPrompt } from './kit'
import { logger } from './logger'
import { findAttachButton, findPrimaryAction, rejectEditable } from './locate'
import { findScroller } from './messages'
import { whenReady } from './ready'
import { SLUG, URLS } from './repo'
import { session } from './runtime'
import { storage } from './storage'
import { threadOf } from './threads'
import { installTheme } from './theme'
import { tutorialSource } from './tutorial-source'

const onSend = (listener: () => void): (() => void) =>
  session.subscribe((event) => {
    if (event === 'generation-start') listener()
  })

whenReady(() => {
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
    tutorial: tutorialSource,
    codeBlockRoot: (pre) => pre.closest<HTMLElement>('[data-chatgpt-copy-code]') ?? pre.closest<HTMLElement>('[data-code-block]'),
    rejectEditable,
    send: (editable) => void composerKit.sendComposer(editable),
    splitterDefaults: SPLITTER_DEFAULTS,
    attachBlocked: () => (fileBudget(session).remainingUploads === 0 ? 'No file uploads left until your limit resets.' : null),
    scroller: findScroller
  })

  installTheme()

  new App()
    .register((context) => new HeaderButtonFeature(context))
    .register((context) => new PromptLibraryFeature(context))
    .register((context) => new SelectionToolbarFeature(context))
    .register((context) => new MaxWidthFeature(context, { storage, sidebar: { rule: { id: 'left-sidebar', selector: 'aside' }, label: 'Left Sidebar', defaultRemoved: false } }))
    .register((context) => new CodeBlocksFeature(context))
    .register((context) => new EnterAsNewlineFeature(context))
    .register((context) => new MessageSplitterFeature(context))
    .register((context) => new BatchRunnerFeature(context))
    .register((context) => new DraftGuardFeature(context))
    .register((context) => new CommandPaletteFeature(context))
    .register((context) => new PromptQueueFeature(context))
    .register((context) => new RecallFeature(context))
    .register((context) => new ContextPacksFeature(context))
    .register((context) => new ExporterFeature(context))
    .register((context) => new UpdatesFeature(context))
    .register((context) => new UsageFeature(context))
    .register((context) => new TutorialFeature(context))
    .register((context) => new DiagnosticsFeature(context))
    .start()
})
