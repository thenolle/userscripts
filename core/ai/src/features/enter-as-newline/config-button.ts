import { createElement, injectStyle } from '@nolly/core'
import { markUi, uiConfig } from '../../ui/config'
import { ensureUiStyles } from '../../ui/styles'
import { Tooltip } from '../../ui/tooltip'
import { mountComposerTool, unmountComposerTool } from '../../ui/composer-toolbar'

const SVG_NS = 'http://www.w3.org/2000/svg'

const CSS = `
.bp-config-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
}

.bp-config-button svg { pointer-events: none; }
`

const createIcon = (): SVGSVGElement => {
  const svg = document.createElementNS(SVG_NS, 'svg')
  for (const [name, value] of Object.entries({ width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(name, value)
  const arrow = document.createElementNS(SVG_NS, 'polyline')
  arrow.setAttribute('points', '9 10 4 15 9 20')
  const line = document.createElementNS(SVG_NS, 'path')
  line.setAttribute('d', 'M20 4v7a4 4 0 0 1-4 4H4')
  svg.append(arrow, line)
  return svg
}

export class ConfigButton {
  readonly element = markUi(createElement('button', 'bp-config-button'))
  private readonly tooltip: Tooltip

  constructor(onClick: () => void, describe: () => string) {
    ensureUiStyles()
    injectStyle(`${uiConfig().id}-enter-styles`, CSS)
    this.element.type = 'button'
    this.element.setAttribute('aria-label', 'Configure Enter as Newline')
    this.element.appendChild(createIcon())
    this.element.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      onClick()
    })
    this.tooltip = new Tooltip(this.element, (container) => {
      container.append(createElement('div', 'bp-tip-mode', 'Enter as Newline'), createElement('div', 'bp-tip-sub', describe()), createElement('div', 'bp-tip-foot', 'Click to configure'))
    })
  }

  mount(): void {
		if (!mountComposerTool(this.element, 'config')) this.tooltip.hide()
	}

	unmount(): void {
		this.tooltip.hide()
		unmountComposerTool(this.element, 'config')
	}
}
