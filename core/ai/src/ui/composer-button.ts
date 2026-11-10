import { createElement } from '@nolly/core'
import { markUi } from './config'
import { mountComposerTool, unmountComposerTool } from './composer-toolbar'
import { createIcon, type IconName } from './icons'
import { ensureUiStyles } from './styles'
import { Tooltip } from './tooltip'

export interface ComposerButtonOptions {
	id: string
	after?: readonly string[]
}

export class ComposerButton {
	readonly element = markUi(createElement('button'))
	private readonly tooltip: Tooltip

	constructor(label: string, icon: IconName, hint: string, onClick: () => void, private readonly options: ComposerButtonOptions) {
		ensureUiStyles()
		this.element.className = `bp-composer-button bp-cb-${options.id}`
		this.element.type = 'button'
		this.element.setAttribute('aria-label', label)
		this.element.appendChild(createIcon(icon, 16))
		this.element.addEventListener('click', (event) => {
			event.preventDefault()
			event.stopPropagation()
			onClick()
		})
		this.tooltip = new Tooltip(this.element, (container) => container.append(createElement('div', 'bp-tip-mode', label), createElement('div', 'bp-tip-sub', hint)))
	}

	mount(): void {
		if (!mountComposerTool(this.element, this.options.id)) this.tooltip.hide()
	}

	unmount(): void {
		this.tooltip.hide()
		unmountComposerTool(this.element, this.options.id)
	}
}
