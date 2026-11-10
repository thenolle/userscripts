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
	private readonly toggles = new Map<Flag, HTMLButtonElement>()
	private readonly lineCount: number
	private readonly originalDisplay: string
	private readonly originalPriority: string

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
		this.build()
	}

	get text(): string {
		return this.info.text
	}

	get fenced(): string {
		const longest = Math.max(0, ...(this.text.match(/`+/g) ?? []).map((run) => run.length))
		const marker = '`'.repeat(Math.max(3, longest + 1))
		return `${marker}${this.info.language === 'text' ? '' : this.info.language}\n${this.text}\n${marker}`
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
		if (this.originalDisplay) this.root.style.setProperty('display', this.originalDisplay, this.originalPriority)
		else this.root.style.removeProperty('display')
	}

	private setFlag(flag: Flag, value: boolean): void {
		this.element.dataset[flag] = String(value)
		this.toggles.get(flag)?.setAttribute('aria-pressed', String(value))
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

	private toggle(flag: Flag, icon: IconName, title: string, value: boolean): HTMLButtonElement {
		const button = this.button(icon, title, () => {
			this.setFlag(flag, this.element.dataset[flag] !== 'true')
		})
		this.toggles.set(flag, button)
		this.setFlag(flag, value)
		return button
	}

	private renderSource(): void {
		let lines: HTMLElement[]
		if (this.settings.highlight === 'builtin') {
			lines = highlightLines(this.text, this.info.language)
				?? renderPlainLines(this.text, this.info.language === 'diff')
		} else if (this.settings.highlight === 'site') {
			lines = splitHighlighted(this.source.querySelector('code') ?? this.source, this.lineCount)
		} else {
			lines = renderPlainLines(this.text, this.info.language === 'diff')
		}
		const fragment = document.createDocumentFragment()
		lines.forEach((line, index) => {
			if (index > 0) fragment.appendChild(document.createTextNode('\n'))
			const cell = line.querySelector('.bp-text')
			for (const child of cell?.childNodes ?? []) fragment.appendChild(child.cloneNode(true))
		})
		if (fragment.textContent === this.text) this.code.appendChild(fragment)
		else this.code.textContent = this.text
	}

	private build(): void {
		const meta = createElement('div', 'bp-code-meta')
		meta.append(createLanguageIcon(this.info.language), createElement('span', 'bp-code-lang', languageInfo(this.info.language).name))
		if (this.info.filename) meta.appendChild(createElement('span', 'bp-code-file', this.info.filename))
		meta.appendChild(createElement('span', 'bp-code-count', `${this.lineCount} lines`))
		const actions = createElement('div', 'bp-code-actions')
		actions.append(this.toggle('wrap', 'wrap', 'Wrap lines', this.settings.wrap), this.toggle('lines', 'lines', 'Line numbers', this.settings.lineNumbers))
		const collapsible = this.settings.collapseAfter > 0 && this.lineCount > this.settings.collapseAfter
		if (collapsible) actions.appendChild(this.toggle('collapsed', 'fold', 'Fold code', false))
		const copy = this.button('copy', 'Copy code', () => {
			void copyText(this.text).then((ok) => {
				if (!ok) return
				copy.replaceChildren(createIcon('check', 16))
				window.setTimeout(() => copy.replaceChildren(createIcon('copy', 16)), 1_200)
			})
		})
		actions.appendChild(copy)
		actions.appendChild(this.button('download', 'Download code', () => {
			const filename = (this.info.filename ?? `snippet.${languageInfo(this.info.language).ext}`).split(/[\\/]/).pop() || 'snippet.txt'
			saveFile(filename, this.text)
		}))
		const head = createElement('div', 'bp-code-head')
		head.append(meta, actions)
		this.gutter.setAttribute('aria-hidden', 'true')
		this.gutter.textContent = Array.from({ length: this.lineCount }, (_, index) => index + 1).join('\n')
		const pre = createElement('pre', 'bp-code-native-pre')
		pre.tabIndex = 0
		pre.setAttribute('aria-label', `${languageInfo(this.info.language).name} source code`)
		this.renderSource()
		pre.appendChild(this.code)
		const scroll = createElement('div', 'bp-code-scroll')
		scroll.append(this.gutter, pre)
		const body = createElement('div', 'bp-code-body')
		body.appendChild(scroll)
		this.element.style.setProperty('--bp-code-collapse', String(this.settings.collapseAfter))
		this.element.append(head, body)
		if (collapsible) {
			const expand = createElement('button', 'bp-code-more', 'Expand code')
			expand.type = 'button'
			expand.addEventListener('click', () => this.setFlag('collapsed', false))
			this.element.appendChild(expand)
		}
		this.element.addEventListener('copy', this.handleCopy, true)
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
