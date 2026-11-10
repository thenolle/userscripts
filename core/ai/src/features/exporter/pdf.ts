import type { Block, Inline } from './markdown'

interface Heading {
	readonly index: number
	readonly id: string
	readonly level: number
	readonly title: string
}

const escape = (text: string): string => text.replace(/[&<>"']/g, (character) => ({
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
}[character] ?? character))

const safeUrl = (value: string): string | null => {
	try {
		const url = new URL(value, location.href)
		return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null
	} catch {
		return null
	}
}

const plain = (inlines: readonly Inline[]): string => inlines.map((inline) => inline.text).join('')

const renderInlines = (inlines: readonly Inline[]): string => inlines.map((inline) => {
	let content = escape(inline.text)
	if (inline.code) content = `<code>${content}</code>`
	if (inline.bold) content = `<strong>${content}</strong>`
	if (inline.italic) content = `<em>${content}</em>`
	const url = inline.link ? safeUrl(inline.link) : null
	return url ? `<a href="${escape(url)}">${content}</a>` : content
}).join('')

const meaningfulParagraph = (block: Block): boolean => block.type === 'paragraph' && plain(block.inlines).trim() !== ''

const renderTable = (block: Extract<Block, { type: 'table' }>): string => {
	const columns = Math.max(1, block.header.length, ...block.rows.map((row) => row.length))
	const cells = (row: readonly Inline[][], tag: 'th' | 'td'): string => Array.from({ length: columns }, (_, index) => `<${tag}${tag === 'th' ? ' scope="col"' : ''}>${renderInlines(row[index] ?? [])}</${tag}>`).join('')

	return `<div class="table-wrap"><table>
    <thead><tr>${cells(block.header, 'th')}</tr></thead>
    <tbody>${block.rows.map((row) => `<tr>${cells(row, 'td')}</tr>`).join('')}</tbody>
  </table></div>`
}

const renderList = (items: readonly Extract<Block, { type: 'item' }>[]): string => {
	let cursor = 0

	const level = (depth: number): string => {
		let output = ''

		while (cursor < items.length && items[cursor]!.depth === depth) {
			const first = items[cursor]!
			const ordered = first.ordered
			const tag = ordered ? 'ol' : 'ul'
			output += `<${tag}${ordered ? ` start="${first.number}"` : ''}>`

			while (cursor < items.length&& items[cursor]!.depth === depth&& items[cursor]!.ordered === ordered) {
				const item = items[cursor++]!
				output += `<li${ordered ? ` value="${item.number}"` : ''}>${renderInlines(item.inlines)}`
				if (cursor < items.length && items[cursor]!.depth > depth) output += level(items[cursor]!.depth)
				output += '</li>'
			}

			output += `</${tag}>`
		}

		return output
	}

	let output = ''
	while (cursor < items.length) output += level(items[cursor]!.depth)
	return output
}

const CSS = `
:root {
  color-scheme: light;
  --ink: #18181b;
  --muted: #52525b;
  --border: #e4e4e7;
  --surface: #f4f4f5;
  --accent: #1d4ed8;
}
* { box-sizing: border-box; }
html { background: #eceef2; }
body {
  margin: 0;
  color: var(--ink);
  font: 11pt/1.65 system-ui, -apple-system, "Segoe UI", sans-serif;
}
.toolbar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: #fff;
}
.toolbar p { margin: 0; color: var(--muted); font-size: 13px; }
button {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: #18181b;
  color: #fff;
  font: 500 13px system-ui, sans-serif;
  cursor: pointer;
}
button:focus-visible, a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.report {
  max-width: 960px;
  margin: 28px auto;
  padding: 56px;
  background: #fff;
  box-shadow: 0 8px 40px rgb(0 0 0 / 8%);
}
.cover {
  padding-bottom: 28px;
  border-bottom: 3px solid var(--accent);
}
.eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-size: 9pt;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
}
h1 {
  margin: 0 0 18px;
  font-size: 27pt;
  line-height: 1.18;
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
}
.meta {
  display: grid;
  gap: 5px;
  color: var(--muted);
  font-size: 9pt;
}
.meta p { margin: 0; }
nav { margin: 28px 0; padding: 22px; border: 1px solid var(--border); border-radius: 8px; }
nav h2 { margin: 0 0 12px; font-size: 15pt; }
nav ol { margin: 0; padding-left: 20px; }
nav li { margin: 5px 0; }
nav a { text-decoration: none; }
.toc-depth-2 { margin-left: 14px; }
.toc-depth-3 { margin-left: 28px; }
article { margin-top: 32px; }
article h2, article h3, article h4, article h5, article h6 {
  break-after: avoid;
  page-break-after: avoid;
  margin: 26px 0 10px;
  line-height: 1.3;
  letter-spacing: -.02em;
}
article h2 { padding-bottom: 9px; border-bottom: 1px solid var(--border); color: #172554; font-size: 19pt; }
article h3 { color: #1e3a8a; font-size: 15pt; }
article h4 { font-size: 12pt; }
article h5, article h6 { font-size: 11pt; }
p { margin: 0 0 12px; orphans: 3; widows: 3; }
li { margin: 4px 0; }
a { color: var(--accent); overflow-wrap: anywhere; }
blockquote {
  margin: 18px 0;
  padding: 12px 18px;
  border-left: 3px solid #93c5fd;
  background: #eff6ff;
  color: #334155;
}
blockquote p:last-child { margin-bottom: 0; }
code { font: .9em/1.6 ui-monospace, "Cascadia Code", Consolas, monospace; }
p code, li code, td code {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--surface);
  overflow-wrap: anywhere;
}
.code-panel { margin: 18px 0; border: 1px solid var(--border); border-radius: 7px; }
.code-label {
  padding: 7px 12px;
  border-bottom: 1px solid var(--border);
  background: #eef2ff;
  color: #3730a3;
  font: 600 9pt system-ui, sans-serif;
  break-after: avoid;
}
pre {
  margin: 0;
  padding: 14px;
  background: #fafafa;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  tab-size: 4;
}
pre code { font-size: 9pt; }
.table-wrap { margin: 18px 0; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9pt; }
th, td {
  padding: 9px 10px;
  border: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}
th { background: #eef2ff; color: #312e81; font-weight: 650; }
tbody tr:nth-child(even) { background: #fafafa; }
thead { display: table-header-group; }
hr { margin: 24px 0; border: 0; border-top: 1px solid var(--border); }
footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid var(--border); color: var(--muted); font-size: 9pt; }
@page { size: A4; margin: 18mm 16mm; }
@media print {
  html, body { background: #fff; }
  .toolbar { display: none !important; }
  .report { max-width: none; margin: 0; padding: 0; box-shadow: none; }
  .cover { break-after: page; }
  nav { break-after: page; border: 0; padding: 0; }
  article { margin-top: 0; }
  * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  pre { overflow: visible; }
}
@media (max-width: 700px) {
  .report { margin: 0; padding: 24px; }
}
`

export const buildPrintHtml = (blocks: readonly Block[], title: string): string => {
	const headings: Heading[] = []
	let skippedTitle = false

	blocks.forEach((block, index) => {
		if (block.type !== 'heading') return
		const text = plain(block.inlines).trim()
		if (!skippedTitle && index === 0 && block.level === 1 && text === title.trim()) {
			skippedTitle = true
			return
		}
		headings.push({ index, id: `section-${index}`, level: block.level, title: text })
	})

	const headingMap = new Map(headings.map((heading) => [heading.index, heading]))
	const body: string[] = []

	for (let index = 0; index < blocks.length; index++) {
		const block = blocks[index]!
		if (index === 0 && skippedTitle) continue

		if (block.type === 'heading') {
			const heading = headingMap.get(index)!
			const level = Math.max(2, Math.min(6, block.level + 1))
			body.push(`<h${level} id="${heading.id}">${renderInlines(block.inlines)}</h${level}>`)
		} else if (block.type === 'paragraph') {
			if (meaningfulParagraph(block)) body.push(`<p>${renderInlines(block.inlines)}</p>`)
		} else if (block.type === 'item') {
			const items: Extract<Block, { type: 'item' }>[] = [block]
			while (blocks[index + 1]?.type === 'item') {
				items.push(blocks[++index] as Extract<Block, { type: 'item' }>)
			}
			body.push(renderList(items))
		} else if (block.type === 'quote') {
			body.push(`<blockquote><p>${renderInlines(block.inlines)}</p></blockquote>`)
		} else if (block.type === 'code') {
			body.push(`<section class="code-panel" aria-label="Code block">
        <div class="code-label">${escape(block.language || 'Plain text')}</div>
        <pre><code>${escape(block.text)}</code></pre>
      </section>`)
		} else if (block.type === 'table') {
			body.push(renderTable(block))
		} else {
			body.push('<hr>')
		}
	}

	const minimumLevel = Math.min(...headings.map((heading) => heading.level), 1)
	const contents = headings.length ? `<nav aria-label="Table of contents">
    <h2>Contents</h2>
    <ol>${headings.map((heading, index) =>
		`<li class="toc-depth-${Math.min(3, heading.level - minimumLevel)}">
        <a href="#${heading.id}">${index + 1}. ${escape(heading.title)}</a>
      </li>`
	).join('')}</ol>
  </nav>` : ''

	return `<!doctype html>
<html lang="${escape(document.documentElement.lang || 'en')}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escape(title)}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="toolbar">
    <button id="print-report" type="button">Print / Save as PDF</button>
    <p>Choose Save as PDF. Enable background graphics for colors and browser headers/footers for page numbers.</p>
  </div>
  <main class="report">
    <header class="cover">
      <p class="eyebrow">Conversation report</p>
      <h1>${escape(title)}</h1>
      <div class="meta">
        <p>Exported: ${escape(new Date().toISOString())}</p>
        <p>Source: <a href="${escape(location.href)}">${escape(location.href)}</a></p>
        <p>Text-based export · headings, lists, tables and code remain selectable.</p>
      </div>
    </header>
    ${contents}
    <article aria-label="Conversation">${body.join('\n')}</article>
    <footer>For machine processing, retain the Markdown or JSON export alongside this PDF.</footer>
  </main>
</body>
</html>`
}

export const openPdfPreview = (target: Window, blocks: readonly Block[], title: string): void => {
	target.document.open()
	target.document.write(buildPrintHtml(blocks, title))
	target.document.close()

	const button = target.document.getElementById('print-report')
	if (!button) throw new Error('The PDF preview could not be initialized.')

	button.addEventListener('click', () => {
		void target.document.fonts.ready.then(() => {
			target.focus()
			target.print()
		})
	})
}
