import { App } from './core/app'
import { fetchSpy } from './core/fetch-spy'
import { BatchRunnerModule } from './modules/batch-runner'
import { CodeBlocksModule } from './modules/code-blocks'
import { CommandPaletteModule } from './modules/command-palette'
import { DraftGuardModule } from './modules/draft-guard'
import { EnterAsNewlineModule } from './modules/enter-as-newline'
import { ExporterModule } from './modules/exporter'
import { GlobalSettingsModule } from './modules/global-settings'
import { MaxWidthModule } from './modules/max-width'
import { MessageSplitterModule } from './modules/message-splitter'
import { PromptLibraryModule } from './modules/prompt-library'
import { SelectionToolbarModule } from './modules/selection-toolbar'
import { TutorialModule } from './modules/tutorial'
import { UpdatesModule } from './modules/updates'
import { UsageStatusModule } from './modules/usage-status'

fetchSpy.install()

new App()
  .register((context) => new PromptLibraryModule(context))
  .register((context) => new SelectionToolbarModule(context))
  .register((context) => new MaxWidthModule(context))
  .register((context) => new EnterAsNewlineModule(context))
  .register((context) => new CodeBlocksModule(context))
  .register((context) => new MessageSplitterModule(context))
  .register((context) => new BatchRunnerModule(context))
  .register((context) => new DraftGuardModule(context))
  .register((context) => new CommandPaletteModule(context))
  .register((context) => new ExporterModule(context))
  .register((context) => new UsageStatusModule(context))
  .register((context) => new GlobalSettingsModule(context))
  .register((context) => new TutorialModule(context))
  .register((context) => new UpdatesModule(context))
  .start()