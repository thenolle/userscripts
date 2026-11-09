import { copyText } from '../../core/clipboard'
import { createElement } from '@nolly/core'
import { markUi } from '../../core/dom'
import { createIcon, type IconName } from '../../ui/icons'
import type { BlockInfo } from './detect'
import { highlightLines } from './highlight'
import { languageInfo } from './languages'
import { renderPlainLines, splitHighlighted } from './lines'
import type { CodeBlockSettings } from './settings'
import { ensureCodeStyles } from './styles'
import { createLanguageIcon } from './badges'

type Flag = 'wrap' | 'lines' | 'collapsed'

const FLASH_MS = 1_200

export class EnhancedBlock {
  readonly element = markUi(createElement('div', 'bp-code'))
  private readonly lineCount: number
  private readonly collapsible: boolean
  private readonly toggles = new Map<Flag, HTMLButtonElement>()

  constructor(
    readonly source: HTMLElement,
    readonly root: HTMLElement,
    readonly info: BlockInfo,
    private readonly settings: CodeBlockSettings
  ) {
    ensureCodeStyles()
    this.lineCount = info.text.split('\n').length
    this.collapsible = settings.collapseAfter > 0 && this.lineCount > settings.collapseAfter
    this.build()
  }

  get text(): string {
    return this.info.text
  }

  get fenced(): string {
    const language = this.info.language === 'text' ? '' : this.info.language
    return `\`\`\`${language}\n${this.info.text}\n\`\`\``
  }

  mount(): void {
    this.root.insertAdjacentElement('beforebegin', this.element)
    this.ensureHidden()
  }

  ensureHidden(): void {
    if (this.root.style.getPropertyValue('display') !== 'none') this.root.style.setProperty('display', 'none', 'important')
  }

  destroy(): void {
    this.element.remove()
    this.root.style.removeProperty('display')
  }

  private setFlag(flag: Flag, value: boolean): void {
    this.element.dataset[flag] = String(value)
    this.toggles.get(flag)?.setAttribute('aria-pressed', String(value))
  }

  private button(icon: IconName, title: string, onClick: (button: HTMLButtonElement) => void): HTMLButtonElement {
    const button = createElement('button', 'bp-code-btn')
    button.type = 'button'
    button.title = title
    button.setAttribute('aria-label', title)
    button.appendChild(createIcon(icon, 15))
    button.addEventListener('click', () => onClick(button))
    return button
  }

  private toggle(flag: Flag, icon: IconName, title: string, initial: boolean): HTMLButtonElement {
    const button = this.button(icon, title, () => this.setFlag(flag, this.element.dataset[flag] !== 'true'))
    this.toggles.set(flag, button)
    this.setFlag(flag, initial)
    return button
  }

  private swapIcon(button: HTMLButtonElement, icon: IconName, restore: IconName): void {
    button.replaceChildren(createIcon(icon, 15))
    button.dataset['done'] = 'true'
    window.setTimeout(() => {
      button.replaceChildren(createIcon(restore, 15))
      delete button.dataset['done']
    }, FLASH_MS)
  }

  private download(): void {
    const { filename, language, text } = this.info
    const name = (filename ?? `snippet.${languageInfo(language).ext}`).split(/[\\/]/).pop() ?? 'snippet.txt'
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const link = createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  private renderLines(): HTMLElement[] {
    const { language, text } = this.info
    const diff = language === 'diff'
    if (diff || this.settings.highlight === 'plain') return renderPlainLines(text, diff)
    if (this.settings.highlight === 'builtin') return highlightLines(text, language) ?? renderPlainLines(text, false)
    const original = this.source.querySelector('code') ?? this.source
    return original.hasChildNodes() ? splitHighlighted(original, this.lineCount) : renderPlainLines(text, false)
  }

  private build(): void {
    const { language, filename } = this.info
    const info = languageInfo(language)
    const meta = createElement('div', 'bp-code-meta')
    meta.append(createLanguageIcon(language), createElement('span', 'bp-code-lang', info.name))
    if (filename) meta.appendChild(createElement('span', 'bp-code-file', filename))
    meta.appendChild(createElement('span', 'bp-code-count', `${this.lineCount} ${this.lineCount === 1 ? 'line' : 'lines'}`))
    const actions = createElement('div', 'bp-code-actions')
    actions.append(this.toggle('wrap', 'wrap', 'Wrap lines', this.settings.wrap), this.toggle('lines', 'lines', 'Line numbers', this.settings.lineNumbers))
    if (this.collapsible) actions.appendChild(this.toggle('collapsed', 'fold', 'Fold long code', true))
    actions.append(
      this.button('copy', 'Copy code', (button) => void copyText(this.info.text).then((ok) => ok && this.swapIcon(button, 'check', 'copy'))),
      this.button('download', 'Download as file', () => this.download())
    )
    const header = createElement('div', 'bp-code-head')
    header.append(meta, actions)
    const pre = createElement('pre', 'bp-code-pre')
    const code = createElement('code')
    code.append(...this.renderLines())
    pre.appendChild(code)
    const body = createElement('div', 'bp-code-body')
    body.appendChild(pre)
    this.element.style.setProperty('--bp-lang-hue', String(info.hue))
    this.element.style.setProperty('--bp-code-collapse', String(this.settings.collapseAfter))
    this.element.style.setProperty('--bp-digits', String(String(this.lineCount).length))
    this.element.dataset['collapsed'] = 'false'
    this.element.append(header, body)
    this.element.addEventListener('copy', this.handleCopy)
    if (!this.collapsible) return
    this.setFlag('collapsed', true)
    const more = createElement('button', 'bp-code-more', `Show ${this.lineCount - this.settings.collapseAfter} more lines`)
    more.type = 'button'
    more.addEventListener('click', () => this.setFlag('collapsed', false))
    this.element.appendChild(more)
  }

  private locate(lines: HTMLElement[], code: Element | null, node: Node, offset: number, isEnd: boolean): { line: number; column: number } | null {
    const element = node instanceof Element ? node : node.parentElement
    const line = element?.closest<HTMLElement>('.bp-line')
    if (line) {
      const index = lines.indexOf(line)
      const cell = line.querySelector<HTMLElement>('.bp-text')
      if (index < 0 || !cell) return null
      if (!cell.contains(node)) return { line: index, column: isEnd ? (cell.textContent ?? '').length : 0 }
      const probe = document.createRange()
      probe.selectNodeContents(cell)
      probe.setEnd(node, offset)
      return { line: index, column: probe.toString().length }
    }
    const last = lines.length - 1
    if (node !== code) return isEnd ? { line: last, column: (lines[last]?.querySelector('.bp-text')?.textContent ?? '').length } : { line: 0, column: 0 }
    const index = Math.min(Math.max(isEnd ? offset - 1 : offset, 0), last)
    return { line: index, column: isEnd ? (lines[index]?.querySelector('.bp-text')?.textContent ?? '').length : 0 }
  }

  private readonly handleCopy = (event: ClipboardEvent): void => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount || !event.clipboardData) return
    const range = selection.getRangeAt(0)
    if (!this.element.contains(range.startContainer) || !this.element.contains(range.endContainer)) return
    const lines = [...this.element.querySelectorAll<HTMLElement>('.bp-line')]
    const code = this.element.querySelector('code')
    const start = this.locate(lines, code, range.startContainer, range.startOffset, false)
    const end = this.locate(lines, code, range.endContainer, range.endOffset, true)
    if (!start || !end || end.line < start.line) return
    const source = this.info.text.split('\n')
    const text = start.line === end.line ? (source[start.line] ?? '').slice(start.column, end.column) : [(source[start.line] ?? '').slice(start.column), ...source.slice(start.line + 1, end.line), (source[end.line] ?? '').slice(0, end.column)].join('\n')
    event.clipboardData.setData('text/plain', text)
    event.preventDefault()
  }
}