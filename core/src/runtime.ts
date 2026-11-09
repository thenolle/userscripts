import { createUiMarker, type UiMarker } from './dom'
import { Emitter } from './events'
import { type Command, type Feature, type ScriptContext, type ScriptEvents } from './feature'
import { createLogger, type Logger } from './logger'
import { MenuController, type MenuEntry } from './menu'
import { createStorage, type ScriptStorage, type StorageOptions } from './storage'

export type FeatureFactory = (context: ScriptContext) => Feature

export interface UserscriptOptions {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly storage?: Partial<StorageOptions>
  readonly ui?: UiMarker
  readonly isReady?: () => boolean
  readonly observe?: MutationObserverInit
  readonly initializationDelay?: number
  readonly safetyInterval?: number
  readonly clearConsole?: boolean
  readonly openSettings?: (script: Userscript) => void
}

const DEFAULT_OBSERVE: MutationObserverInit = { childList: true, subtree: true }

const slug = (label: string): string => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export class Userscript implements ScriptContext {
  readonly logger: Logger
  readonly storage: ScriptStorage
  readonly events = new Emitter<ScriptEvents>()
  private readonly features: Feature[] = []
  private readonly menu = new MenuController()
  private readonly ui: UiMarker
  private readonly observer = new MutationObserver((mutations) => this.handleMutations(mutations))
  private scheduled = false
  private initialized = false
  private timer: number | null = null
  private href = ''

  constructor(private readonly options: UserscriptOptions) {
    this.logger = createLogger(options.name)
    this.storage = createStorage({ namespace: options.id, ...options.storage })
    this.ui = options.ui ?? createUiMarker()
  }

  readonly requestUpdate = (): void => {
    if (this.scheduled || !this.initialized) return
    this.scheduled = true
    requestAnimationFrame(() => {
      this.scheduled = false
      this.update()
    })
  }

  readonly openSettings = (): void => this.options.openSettings?.(this)

  readonly refreshMenu = (): void => this.menu.sync(this.collectMenuEntries())

  readonly getFeatures = (): readonly Feature[] => this.features

  readonly getCommands = (): Command[] =>
    this.features.flatMap((feature): Command[] => {
      const group = feature.name
      const toggle: Command = { id: `${feature.id}:toggle`, group, title: `${feature.enabled ? 'Disable' : 'Enable'} ${feature.name}`, run: () => feature.toggle() }
      if (!feature.enabled) return [toggle]
      const fromMenu = feature.menuEntries().map((entry): Command => ({ id: `${feature.id}:${entry.id ?? slug(entry.label)}`, group, title: entry.label, run: entry.action }))
      const extra = feature.commands().map((command): Command => ({ ...command, id: `${feature.id}:${command.id}`, group }))
      return [toggle, ...fromMenu, ...extra]
    })

  readonly runCommand = (id: string): boolean => {
    const command = this.getCommands().find((candidate) => candidate.id === id)
    if (!command) return false
    void command.run()
    return true
  }

  register(factory: FeatureFactory): this {
    this.features.push(factory(this))
    return this
  }

  start(): void {
    if (this.options.clearConsole) console.clear()
    if (!document.body) {
      this.logger.warning('Document body not available. Waiting for DOM...')
      document.addEventListener('DOMContentLoaded', () => this.start(), { once: true })
      return
    }
    this.logger.banner(this.options.version)
    this.logger.info('Starting userscript...')
    this.observer.observe(document.body, this.options.observe ?? DEFAULT_OBSERVE)
    window.addEventListener('popstate', this.requestUpdate)
    window.setInterval(this.requestUpdate, this.options.safetyInterval ?? 2_000)
    this.initialize()
  }

  private collectMenuEntries(): MenuEntry[] {
    return this.features.flatMap((feature) => [{ label: `${feature.enabled ? 'Disable' : 'Enable'} ${feature.name}`, action: () => feature.toggle() }, ...feature.menuEntries()])
  }

  private isReady(): boolean {
    return (this.options.isReady ?? (() => Boolean(document.body)))()
  }

  private initialize(): void {
    if (this.initialized || this.timer !== null || !this.isReady()) return
    this.logger.info('Interface detected. Waiting for UI stabilization...')
    this.timer = window.setTimeout(() => {
      this.timer = null
      if (this.initialized || !this.isReady()) return
      this.initialized = true
      this.href = location.href
      this.update()
      this.refreshMenu()
      this.logger.success('Initialized successfully.')
      for (const feature of this.features) this.logger.info(`${feature.name}: ${feature.enabled ? 'enabled' : 'disabled'}`)
      this.events.emit('ready', undefined, (error) => this.logger.errorOnce('ready listener failed.', error))
    }, this.options.initializationDelay ?? 500)
  }

  private update(): void {
    if (location.href !== this.href) {
      this.href = location.href
      this.events.emit('navigate', this.href, (error) => this.logger.errorOnce('navigate listener failed.', error))
    }
    for (const feature of this.features) {
      try {
        feature.sync()
        feature.run()
      } catch (error) {
        this.logger.errorOnce(`${feature.name} failed.`, error)
      }
    }
  }

  private handleMutations(mutations: MutationRecord[]): void {
    if (mutations.every(({ target }) => this.ui.isOwn(target))) return
    if (this.initialized) this.requestUpdate()
    else this.initialize()
  }
}
