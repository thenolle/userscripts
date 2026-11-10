import { createElement } from '@nolly/core'
import { copyText } from '../../clipboard'
import { saveFile } from '../../download'
import { markUi } from '../../ui/config'
import { createIcon, type IconName } from '../../ui/icons'
import { createLanguageIcon } from './badges'
import type { BlockInfo } from './detect'
import { highlightLines } from './highlight'
import { languageInfo } from './languages'
import { renderPlainLines, splitHighlighted } from './lines'
import type { CodeBlockSettings } from './settings'
import { ensureCodeStyles } from './styles'

type Flag = 'wrap' | 'lines' | 'collapsed'

export class EnhancedBlock {
	readonly element = markUi(createElement('div', 'bp-code bp-code-v2 bp-themed'))

	private readonly code = createElement('code', 'bp-code-source')
	private readonly gutter = createElement('div', 'bp-code-gutter')
	private readonly pre = createElement('pre', 'bp-code-native-pre')
	private readonly sourceLines: HTMLElement[] = []
	private readonly gutterLines: HTMLElement[] = []
	private readonly toggles = new Map<Flag, HTMLButtonElement>()
	private readonly lineCount: number
	private readonly originalDisplay: string
	private readonly originalPriority: string
	private readonly resizeObserver: ResizeObserver
	private frame = 0
	private destroyed = false

	constructor(
		readonly source: HTMLElement,
		readonly root: HTMLElement,
		readonly info: BlockInfo,
		private readonly settings: CodeBlockSettings
	) {
		ensureCodeStyles()
		this.lineCount = info.text.split('\n').length
		this.originalDisplay = root.style.getPropertyValue('display')
		this.originalPriority = root.style.getPropertyPriority('display')
		this.resizeObserver = new ResizeObserver(() => this.scheduleGutter())
		this.build()
	}

	get text(): string {
		return this.info.text
	}

	get fenced(): string {
		let longest = 0
		let run = 0
		for (const character of this.text) {
			run = character === '`' ? run + 1 : 0
			longest = Math.max(longest, run)
		}
		const marker = '`'.repeat(Math.max(3, longest + 1))
		const language = this.info.language === 'text' ? '' : this.info.language
		return `${marker}${language}\n${this.text}\n${marker}`
	}

	mount(): void {
		this.root.insertAdjacentElement('beforebegin', this.element)
		this.ensureHidden()
		this.resizeObserver.observe(this.pre)
		this.scheduleGutter()
		void document.fonts.ready.then(() => this.scheduleGutter())
	}

	ensureHidden(): void {
		if (this.root.style.getPropertyValue('display') !== 'none' || this.root.style.getPropertyPriority('display') !== 'important') this.root.style.setProperty('display', 'none', 'important')
	}

	destroy(): void {
		this.destroyed = true
		cancelAnimationFrame(this.frame)
		this.resizeObserver.disconnect()
		this.element.remove()
		if (this.originalDisplay) this.root.style.setProperty('display', this.originalDisplay, this.originalPriority)
		else this.root.style.removeProperty('display')
	}

	private setFlag(flag: Flag, value: boolean): void {
		this.element.dataset[flag] = String(value)
		this.toggles.get(flag)?.setAttribute('aria-pressed', String(value))
		if (flag === 'wrap' || flag === 'lines') this.scheduleGutter()
	}

	private button(icon: IconName, title: string, action: () => void): HTMLButtonElement {
		const button = createElement('button', 'bp-code-btn')
		button.type = 'button'
		button.title = title
		button.setAttribute('aria-label', title)
		button.appendChild(createIcon(icon, 16))
		button.addEventListener('click', action)
		return button
	}

	private toggle(flag: Flag, icon: IconName, title: string, initial: boolean): HTMLButtonElement {
		const button = this.button(icon, title, () => {
			this.setFlag(flag, this.element.dataset[flag] !== 'true')
		})
		this.toggles.set(flag, button)
		this.setFlag(flag, initial)
		return button
	}

	private renderSource(): void {
		const rawLines = this.text.split('\n')
		let highlighted: HTMLElement[] | null = null
		if (this.settings.highlight === 'builtin') highlighted = highlightLines(this.text, this.info.language)
		else if (this.settings.highlight === 'site') highlighted = splitHighlighted(this.source.querySelector('code') ?? this.source, this.lineCount)
		highlighted ??= renderPlainLines(this.text, this.info.language === 'diff')
		rawLines.forEach((text, index) => {
			if (index > 0) this.code.appendChild(document.createTextNode('\n'))
			const line = createElement('span', 'bp-code-logical-line')
			const cell = highlighted[index]?.querySelector('.bp-text')
			if (cell && cell.textContent === text) {
				for (const child of cell.childNodes) line.appendChild(child.cloneNode(true))
			} else {
				line.textContent = text
			}
			this.sourceLines.push(line)
			this.code.appendChild(line)
			const number = createElement('div', 'bp-code-gutter-line', String(index + 1))
			this.gutterLines.push(number)
			this.gutter.appendChild(number)
		})
	}

	private build(): void {
		const meta = createElement('div', 'bp-code-meta')
		meta.append(createLanguageIcon(this.info.language), createElement('span', 'bp-code-lang', languageInfo(this.info.language).name))
		if (this.info.filename) meta.appendChild(createElement('span', 'bp-code-file', this.info.filename))
		meta.appendChild(createElement('span', 'bp-code-count', `${this.lineCount} ${this.lineCount === 1 ? 'line' : 'lines'}`))
		const actions = createElement('div', 'bp-code-actions')
		actions.append(this.toggle('wrap', 'wrap', 'Wrap lines', this.settings.wrap), this.toggle('lines', 'lines', 'Line numbers', this.settings.lineNumbers))
		const collapsible = this.settings.collapseAfter > 0 && this.lineCount > this.settings.collapseAfter
		if (collapsible) actions.appendChild(this.toggle('collapsed', 'fold', 'Fold code', true))
		const copy = this.button('copy', 'Copy code', () => {
			void copyText(this.text).then((ok) => {
				if (!ok || this.destroyed) return
				copy.replaceChildren(createIcon('check', 16))
				window.setTimeout(() => {
					if (!this.destroyed) copy.replaceChildren(createIcon('copy', 16))
				}, 1_200)
			})
		})
		actions.append(
			copy,
			this.button('download', 'Download code', () => {
				const filename = (this.info.filename ?? `snippet.${languageInfo(this.info.language).ext}`).split(/[\\/]/).pop() || 'snippet.txt'
				saveFile(filename, this.text)
			})
		)
		const head = createElement('div', 'bp-code-head')
		head.append(meta, actions)
		this.gutter.setAttribute('aria-hidden', 'true')
		this.pre.tabIndex = 0
		this.pre.setAttribute('aria-label', `${languageInfo(this.info.language).name} source code`)
		this.renderSource()
		this.pre.appendChild(this.code)
		const scroll = createElement('div', 'bp-code-scroll')
		scroll.append(this.gutter, this.pre)
		const body = createElement('div', 'bp-code-body')
		body.appendChild(scroll)
		this.element.style.setProperty('--bp-code-collapse', String(this.settings.collapseAfter))
		this.element.style.setProperty('--bp-code-digits', String(String(this.lineCount).length))
		this.element.append(head, body)
		if (collapsible) {
			const expand = createElement('button', 'bp-code-more', `Expand all ${this.lineCount.toLocaleString()} lines`)
			expand.type = 'button'
			expand.addEventListener('click', () => this.setFlag('collapsed', false))
			this.element.appendChild(expand)
		}
		this.element.addEventListener('copy', this.handleCopy, true)
	}

	private scheduleGutter(): void {
		if (this.destroyed || this.frame) return
		this.frame = requestAnimationFrame(() => {
			this.frame = 0
			this.syncGutter()
		})
	}

	private syncGutter(): void {
		if (!this.element.isConnected || this.destroyed) return
		if (this.element.dataset['lines'] === 'false') return
		const lineHeight = Number.parseFloat(getComputedStyle(this.pre).lineHeight) || 21
		const wrapped = this.element.dataset['wrap'] === 'true'
		const heights = this.sourceLines.map((line) => {
			if (!wrapped || !line.textContent) return lineHeight
			const rect = line.getBoundingClientRect()
			return Math.max(lineHeight, Math.ceil(Math.max(0, rect.height - 0.5) / lineHeight) * lineHeight)
		})
		heights.forEach((height, index) => {
			const row = this.gutterLines[index]!
			const value = `${height}px`
			if (row.style.height !== value) row.style.height = value
		})
	}

	private readonly handleCopy = (event: ClipboardEvent): void => {
		const selection = window.getSelection()
		if (!selection || selection.isCollapsed || !selection.rangeCount || !event.clipboardData) return
		const range = selection.getRangeAt(0)
		if (!this.code.contains(range.startContainer) || !this.code.contains(range.endContainer)) return
		event.clipboardData.setData('text/plain', range.toString())
		event.preventDefault()
		event.stopImmediatePropagation()
	}
}
