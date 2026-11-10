import { copyText } from '@nolly/ai'
import { Feature, type MenuEntry } from '@nolly/core'
import { isOwnUi } from '../../core/dom'
import { isGenerating } from '../../core/generation'
import { logger } from '../../core/logger'
import { EnhancedBlock } from './block'
import { toggleCodeSettingsDialog } from './dialog'
import { analyze, findBlockRoot, readCode } from './detect'
import { loadCodeSettings, saveCodeSettings, type CodeBlockSettings } from './settings'

const STABLE_MS = 900
const FORCE_MS = 6_000
const RESCAN_MS = 500

export class CodeBlocksModule extends Feature {
  readonly id = 'code-blocks'
  readonly name = 'Code Block Pro'
  readonly description = 'Replaces code blocks with copy, wrap, line numbers, folding and download.'

  private settings: CodeBlockSettings = loadCodeSettings()
  private readonly blocks = new Map<HTMLElement, EnhancedBlock>()
  private readonly seen = new WeakMap<HTMLElement, { text: string; since: number }>()
  private rescan = 0

  run(): void {
    if (!this.enabled) {
      this.clear()
      return
    }
    this.prune()
    const generating = isGenerating()
    const now = Date.now()
    let waiting = false
    for (const pre of document.querySelectorAll<HTMLElement>('pre')) {
      if (isOwnUi(pre) || pre.closest('[contenteditable], textarea')) continue
      const text = readCode(pre)
      if (!text.trim()) continue
      const existing = this.blocks.get(pre)
      if (existing?.text === text) continue
      if (existing) this.release(pre)
      const entry = this.seen.get(pre)
      if (!entry || entry.text !== text) {
        this.seen.set(pre, { text, since: now })
        waiting = true
        continue
      }
      const stable = now - entry.since
      if (stable < STABLE_MS || (generating && stable < FORCE_MS)) {
        waiting = true
        continue
      }
      this.enhance(pre, text)
    }
    if (waiting) this.scheduleRescan()
  }

  override menuEntries(): MenuEntry[] {
    return [
      { label: 'Configure Code Block Pro', action: () => this.configure() },
      { label: 'Copy All Code Blocks', action: () => void this.copyAll() }
    ]
  }

  private enhance(pre: HTMLElement, text: string): void {
    try {
      const root = findBlockRoot(pre, this.settings.hideSiteChrome)
      const block = new EnhancedBlock(pre, root, analyze(pre, root, text), this.settings)
      block.mount()
      this.blocks.set(pre, block)
    } catch (error) {
      logger.errorOnce('Code block enhancement failed; the original block is kept.', error)
    }
  }

  private release(source: HTMLElement): void {
    this.blocks.get(source)?.destroy()
    this.blocks.delete(source)
    this.seen.delete(source)
  }

  private prune(): void {
    for (const [source, block] of this.blocks) {
      if (!source.isConnected || !block.root.isConnected || !block.element.isConnected) this.release(source)
      else block.ensureHidden()
    }
  }

  private clear(): void {
    for (const source of [...this.blocks.keys()]) this.release(source)
  }

  private scheduleRescan(): void {
    if (this.rescan) return
    this.rescan = window.setTimeout(() => {
      this.rescan = 0
      this.context.requestUpdate()
    }, RESCAN_MS)
  }

  private configure(): void {
    toggleCodeSettingsDialog(this.settings, (settings) => {
      this.settings = settings
      saveCodeSettings(settings)
      this.clear()
      this.context.requestUpdate()
    })
  }

  private async copyAll(): Promise<void> {
    const ordered = [...this.blocks.values()].sort((a, b) => (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    if (!ordered.length) return
    const ok = await copyText(ordered.map((block) => block.fenced).join('\n\n'))
    logger.info(ok ? `Copied ${ordered.length} code blocks.` : 'Could not copy code blocks.')
  }
}