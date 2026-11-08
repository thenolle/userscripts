import { logger } from './logger'
import { storage } from './storage'

export interface MenuEntry {
  readonly id?: string
  readonly label: string
  readonly action: () => void
}

export interface ModuleCommand {
  readonly id: string
  readonly title: string
  readonly keywords?: string
  readonly run: () => void | Promise<void>
}

export interface Command extends ModuleCommand {
  readonly group: string
}

export interface AppContext {
  readonly requestUpdate: () => void
  readonly refreshMenu: () => void
  readonly openSettings: () => void
  readonly getCommands: () => Command[]
  readonly runCommand: (id: string) => boolean
  readonly getModules: () => readonly FeatureModule[]
}

export abstract class FeatureModule {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly description: string
  readonly defaultEnabled: boolean = true

  constructor(protected readonly context: AppContext) {}

  get enabled(): boolean {
    return storage.get(`module:${this.id}`, this.defaultEnabled)
  }

  set enabled(value: boolean) {
    storage.set(`module:${this.id}`, value)
  }

  abstract run(): void

  menuEntries(): MenuEntry[] {
    return []
  }

  commands(): ModuleCommand[] {
    return []
  }

  toggle(): void {
    this.enabled = !this.enabled
    logger.info(`${this.name} ${this.enabled ? 'enabled' : 'disabled'}.`)
    this.context.refreshMenu()
    this.context.requestUpdate()
  }
}