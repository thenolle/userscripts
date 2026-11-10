import { Feature, toElement } from '@nolly/core'
import type { MenuEntry, ScriptContext } from '@nolly/core'
import { isSendButton, readComposer } from '../../composer'
import { findComposer, platform, storage, writeComposer } from '../../platform'
import { loadSplitterSettings } from '../message-splitter/settings'
import { DraftOverlay } from './overlay'
import { DraftStore } from './store'
import type { Draft } from './store'

const SAVE_DELAY = 400
const SEND_WINDOW = 3_000
const GUARD_KEY = 'draft-guard:warn-on-close'
const SPLIT_COMMAND = 'message-splitter:split'

const defaultThreadKey = (): string => location.pathname || '/'
const meaningful = (text: string): boolean => text.replace(/[\s\u200b]/g, '') !== ''

export class DraftGuardFeature extends Feature {
  readonly id = 'draft-guard'
  readonly name = 'Draft Guard'
  readonly description = 'Autosaves drafts, shows a size meter and warns about unsent text.'

  private readonly store: DraftStore
  private readonly overlay = new DraftOverlay()
  private readonly wired = new WeakSet<HTMLElement>()
  private readonly dismissed = new Set<string>()
  private readonly typed = new Set<string>()
  private readonly offered = new Map<string, Draft>()
  private key: string
  private lastText = ''
  private saveTimer = 0
  private sendIntentAt = 0
  private guardAttached = false
  private composer: HTMLElement | null = null

  constructor(context: ScriptContext) {
    super(context)
    this.store = new DraftStore(storage)
    this.key = this.threadKey()
    this.overlay.onSplit(() => this.context.runCommand(SPLIT_COMMAND))
    platform().onSend(() => {
      if (this.enabled && meaningful(this.lastText)) this.discard(this.key)
    })
    document.addEventListener('click', this.handleClick, true)
    document.addEventListener('keydown', this.handleKeydown, true)
    window.addEventListener('scroll', this.reposition, true)
    window.addEventListener('resize', this.reposition)
  }

  get warnOnClose(): boolean {
    return storage.get(GUARD_KEY, true)
  }

  set warnOnClose(value: boolean) {
    storage.set(GUARD_KEY, value)
  }

  run(): void {
    if (!this.enabled) {
      this.teardown()
      return
    }
    this.syncGuard()
    const composer = findComposer()
    this.composer = composer
    if (!composer) {
      this.overlay.hideAll()
      return
    }
    this.wire(composer)
    this.syncThread()
    const text = readComposer(composer)
    if (text !== this.lastText) this.handleChange(text)
    this.refreshOverlay(composer, text)
  }

  override menuEntries(): MenuEntry[] {
    return [{ id: 'guard', label: `${this.warnOnClose ? 'Disable' : 'Enable'} Unsent-Text Warning`, action: () => this.toggleGuard() }]
  }

  private threadKey(): string {
    return defaultThreadKey()
  }

  private wire(composer: HTMLElement): void {
    if (this.wired.has(composer)) return
    this.wired.add(composer)
    composer.addEventListener('input', (event) => {
      if (event.isTrusted) this.typed.add(this.key)
      this.run()
    })
  }

  private syncThread(): void {
    const key = this.threadKey()
    if (key === this.key) return
    window.clearTimeout(this.saveTimer)
    this.key = key
    this.lastText = ''
  }

  private handleChange(text: string): void {
    const previous = this.lastText
    this.lastText = text
    window.clearTimeout(this.saveTimer)
    if (!meaningful(text)) {
      if (meaningful(previous) && Date.now() - this.sendIntentAt < SEND_WINDOW) this.discard(this.key)
      return
    }
    const key = this.key
    this.saveTimer = window.setTimeout(() => this.store.set(key, text), SAVE_DELAY)
  }

  private discard(key: string): void {
    window.clearTimeout(this.saveTimer)
    this.store.remove(key)
    this.offered.delete(key)
    this.dismissed.add(key)
    this.overlay.hideBanner()
  }

  private refreshOverlay(composer: HTMLElement, text: string): void {
    if (meaningful(text)) this.overlay.showMeter(composer, text, loadSplitterSettings(storage, platform().splitterDefaults).limit)
    else this.overlay.hideMeter()
    const key = this.key
    if (this.dismissed.has(key) || this.typed.has(key)) {
      this.offered.delete(key)
      this.overlay.hideBanner()
      return
    }
    const draft = this.offered.get(key) ?? this.store.get(key)
    if (!draft) {
      this.overlay.hideBanner()
      return
    }
    this.offered.set(key, draft)
    this.overlay.showBanner(
      composer,
      draft,
      () => {
        this.offered.delete(key)
        this.dismissed.add(key)
        this.overlay.hideBanner()
        void writeComposer(composer, draft.text)
      },
      () => this.discard(key)
    )
  }

  private isComposerControl(button: HTMLElement): boolean {
    const composer = this.composer
    if (!composer) return false
    const form = composer.closest('form')
    if (form) return form.contains(button)
    let scope: HTMLElement | null = composer
    for (let depth = 0; scope && depth < 4; depth++) {
      if (scope.contains(button)) return true
      scope = scope.parentElement
    }
    return false
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const button = toElement(event.target)?.closest('button')
    if (!this.enabled || !button || !isSendButton(button) || !this.isComposerControl(button)) return
    this.sendIntentAt = Date.now()
    this.dismissed.add(this.key)
    this.offered.delete(this.key)
    this.overlay.hideBanner()
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && meaningful(this.lastText)) this.sendIntentAt = Date.now()
  }

  private readonly reposition = (): void => {
    if (this.composer?.isConnected) this.overlay.position(this.composer)
  }

  private readonly handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    const composer = this.composer ?? findComposer()
    if (!composer || !meaningful(readComposer(composer))) return
    event.preventDefault()
    event.returnValue = ''
  }

  private syncGuard(): void {
    if (this.warnOnClose && !this.guardAttached) {
      window.addEventListener('beforeunload', this.handleBeforeUnload)
      this.guardAttached = true
    } else if (!this.warnOnClose && this.guardAttached) {
      window.removeEventListener('beforeunload', this.handleBeforeUnload)
      this.guardAttached = false
    }
  }

  private toggleGuard(): void {
    this.warnOnClose = !this.warnOnClose
    this.context.refreshMenu()
    this.context.requestUpdate()
  }

  private teardown(): void {
    this.overlay.hideAll()
    if (this.guardAttached) window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.guardAttached = false
  }
}
