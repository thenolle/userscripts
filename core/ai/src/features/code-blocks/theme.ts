import { injectStyle } from '@nolly/core'
import { uiConfig } from '../../ui/config'

let installed = false

const CSS = `
html[data-bp-code-theme='light'] .bp-code-v2 {
	--bp-bg: #ffffff;
	--bp-fg: #1f2328;
	--bp-muted: #59636e;
	--bp-border: #d1d9e0;
	--bp-accent: #f6f8fa;
	--bp-ring: #0969da;
	--bp-code-keyword: #cf222e;
	--bp-code-string: #0a3069;
	--bp-code-number: #0550ae;
	--bp-code-function: #8250df;
	--bp-code-type: #953800;
	--bp-code-tag: #116329;
	--bp-code-attribute: #0550ae;
	color-scheme: light;
}
html[data-bp-code-theme='dark'] .bp-code-v2 {
	--bp-bg: #0d1117;
	--bp-fg: #e6edf3;
	--bp-muted: #9198a1;
	--bp-border: #30363d;
	--bp-accent: #161b22;
	--bp-ring: #58a6ff;
	--bp-code-keyword: #ff7b72;
	--bp-code-string: #a5d6ff;
	--bp-code-number: #79c0ff;
	--bp-code-function: #d2a8ff;
	--bp-code-type: #ffa657;
	--bp-code-tag: #7ee787;
	--bp-code-attribute: #79c0ff;
	color-scheme: dark;
}
.bp-code-v2 .bp-tok-comment { color: var(--bp-muted); }
.bp-code-v2 .bp-tok-keyword { color: var(--bp-code-keyword); }
.bp-code-v2 .bp-tok-string { color: var(--bp-code-string); }
.bp-code-v2 .bp-tok-number { color: var(--bp-code-number); }
.bp-code-v2 .bp-tok-fn { color: var(--bp-code-function); }
.bp-code-v2 .bp-tok-type { color: var(--bp-code-type); }
.bp-code-v2 .bp-tok-tag { color: var(--bp-code-tag); }
.bp-code-v2 .bp-tok-attr,
.bp-code-v2 .bp-tok-key { color: var(--bp-code-attribute); }
.bp-code-v2 .bp-lang-badge {
	background: var(--c);
	color: var(--badge-fg);
	border-color: transparent;
	font-weight: 700;
}
.bp-code-v2 .bp-code-head { box-shadow: none; }
.bp-code-v2 .bp-code-btn { transition: background 120ms ease, color 120ms ease; }
`

const explicitTheme = (element: HTMLElement): 'dark' | 'light' | null => {
	if (element.classList.contains('dark')) return 'dark'
	if (element.classList.contains('light')) return 'light'
	for (const attribute of ['data-theme', 'data-color-mode', 'data-color-scheme']) {
		const value = element.getAttribute(attribute)?.toLowerCase()
		if (value === 'dark' || value === 'light') return value
	}
	const scheme = getComputedStyle(element).colorScheme.trim()
	return scheme === 'dark' || scheme === 'light' ? scheme : null
}

export const ensureCodeTheme = (): void => {
	injectStyle(`${uiConfig().id}-code-v2-theme`, CSS)
	if (installed) return
	installed = true
	const media = window.matchMedia('(prefers-color-scheme: dark)')
	const update = (): void => {
		const theme = explicitTheme(document.documentElement) ?? (document.body ? explicitTheme(document.body) : null) ?? (media.matches ? 'dark' : 'light')
		if (document.documentElement.dataset['bpCodeTheme'] !== theme) document.documentElement.dataset['bpCodeTheme'] = theme
	}
	const observer = new MutationObserver(update)
	const options: MutationObserverInit = { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-mode', 'data-color-scheme', 'style'] }
	observer.observe(document.documentElement, options)
	if (document.body) observer.observe(document.body, options)
	media.addEventListener('change', update)
	update()
}
