import { CONFIG, OBSERVER_OPTIONS } from '../config'
import { isOwnUi } from './dom'
import { logger } from './logger'
import { MenuController } from './menu'
import { toggleSettingsDialog } from '../ui/settings-dialog'
import type { AppContext, Command, FeatureModule, MenuEntry } from './module'

type ModuleFactory = (context: AppContext) => FeatureModule

const slug = (label: string): string => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export class App implements AppContext {
  private readonly modules: FeatureModule[] = []
  private readonly menu = new MenuController()
  private readonly observer = new MutationObserver((mutations) => this.handleMutations(mutations))
  private scheduled = false
  private initialized = false
  private initializationTimer: number | null = null

  readonly requestUpdate = (): void => {
    if (this.scheduled || !this.initialized) return
    this.scheduled = true
    requestAnimationFrame(() => {
      this.scheduled = false
      this.update()
    })
  }

  readonly openSettings = (): void => {
    toggleSettingsDialog(this.modules, () => {
      this.refreshMenu()
      this.requestUpdate()
    })
  }

  readonly refreshMenu = (): void => {
    this.menu.sync(this.collectMenuEntries())
  }

  readonly getCommands = (): Command[] => this.modules.flatMap((module): Command[] => {
    const group = module.name
    const toggle: Command = { id: `${module.id}:toggle`, group, title: `${module.enabled ? 'Disable' : 'Enable'} ${module.name}`, run: () => module.toggle() }
    if (!module.enabled) return [toggle]
    const fromMenu = module.menuEntries().map((entry): Command => ({ id: `${module.id}:${entry.id ?? slug(entry.label)}`, group, title: entry.label, run: entry.action }))
    const extra = module.commands().map((command): Command => ({ ...command, id: `${module.id}:${command.id}`, group }))
    return [toggle, ...fromMenu, ...extra]
  })

  readonly getModules = (): readonly FeatureModule[] => this.modules

  readonly runCommand = (id: string): boolean => {
    const command = this.getCommands().find((candidate) => candidate.id === id)
    if (!command) return false
    void command.run()
    return true
  }

  register(factory: ModuleFactory): this {
    this.modules.push(factory(this))
    return this
  }

  start(): void {
    console.clear()
    if (!document.body) {
      logger.warning('Document body not available. Waiting for DOM...')
      document.addEventListener('DOMContentLoaded', () => this.start(), { once: true })
      return
    }
    logger.banner(__VERSION__)
    logger.info('Starting userscript...')
    this.observer.observe(document.body, OBSERVER_OPTIONS)
    window.addEventListener('popstate', this.requestUpdate)
    window.setInterval(this.requestUpdate, CONFIG.safetyInterval)
    this.initialize()
  }

  private collectMenuEntries(): MenuEntry[] {
    return this.modules.flatMap((module) => [
      { label: `${module.enabled ? 'Disable' : 'Enable'} ${module.name}`, action: () => module.toggle() },
      ...module.menuEntries()
    ])
  }

  private isUiReady(): boolean {
    return Boolean(document.querySelector('main')?.children.length)
  }

  private initialize(): void {
    if (this.initialized || this.initializationTimer !== null || !this.isUiReady()) return
    logger.info('Interface detected. Waiting for UI stabilization...')
    this.initializationTimer = window.setTimeout(() => {
      this.initializationTimer = null
      if (this.initialized || !this.isUiReady()) return
      this.initialized = true
      this.update()
      this.refreshMenu()
      logger.success('Initialized successfully.')
      for (const module of this.modules) logger.info(`${module.name}: ${module.enabled ? 'enabled' : 'disabled'}`)
    }, CONFIG.initializationDelay)
  }

  private update(): void {
    for (const module of this.modules) {
      try {
        module.run()
      } catch (error) {
        logger.errorOnce(`${module.name} failed.`, error)
      }
    }
  }

  private handleMutations(mutations: MutationRecord[]): void {
    if (mutations.every(({ target }) => isOwnUi(target))) return
    if (this.initialized) this.requestUpdate()
    else this.initialize()
  }
}