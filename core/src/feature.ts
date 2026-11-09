import type { Emitter } from './events'
import type { Logger } from './logger'
import type { MenuEntry } from './menu'
import { Scope } from './scope'
import type { ScriptStorage } from './storage'

export interface FeatureCommand {
  readonly id: string
  readonly title: string
  readonly keywords?: string
  readonly run: () => void | Promise<void>
}

export interface Command extends FeatureCommand {
  readonly group: string
}

export interface ScriptEvents {
  [key: string]: unknown
  ready: undefined
  navigate: string
}

export interface ScriptContext {
  readonly logger: Logger
  readonly storage: ScriptStorage
  readonly events: Emitter<ScriptEvents>
  readonly requestUpdate: () => void
  readonly refreshMenu: () => void
  readonly openSettings: () => void
  readonly getCommands: () => Command[]
  readonly runCommand: (id: string) => boolean
  readonly getFeatures: () => readonly Feature[]
}

export abstract class Feature {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly description: string
  readonly defaultEnabled: boolean = true
  protected readonly scope = new Scope()
  private active = false

  constructor(protected readonly context: ScriptContext) {}

  get enabled(): boolean {
    return this.context.storage.get(`module:${this.id}`, this.defaultEnabled)
  }

  set enabled(value: boolean) {
    this.context.storage.set(`module:${this.id}`, value)
  }

  abstract run(): void

  onEnable(): void {}

  onDisable(): void {}

  menuEntries(): MenuEntry[] {
    return []
  }

  commands(): FeatureCommand[] {
    return []
  }

  toggle(): void {
    this.enabled = !this.enabled
    this.context.logger.info(`${this.name} ${this.enabled ? 'enabled' : 'disabled'}.`)
    this.context.refreshMenu()
    this.context.requestUpdate()
  }

  sync(): void {
    const on = this.enabled
    if (on && !this.active) {
      this.active = true
      this.onEnable()
    } else if (!on && this.active) {
      this.active = false
      this.scope.dispose()
      this.onDisable()
    }
  }
}
