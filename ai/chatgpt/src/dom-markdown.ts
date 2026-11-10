import { isOwnUi } from './dom'

const HEADING = /^H([1-6])$/
const SKIPPED = 'button, svg, script, style, [data-markdown-copy="exclude"], .katex-html'
const BLOCKS = new Set(['P', 'DIV', 'UL', 'OL', 'PRE', 'TABLE', 'BLOCKQUOTE', 'HR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE'])

const skipped = (element: HTMLElement): boolean => isOwnUi(element) || element.matches(SKIPPED)

const tex = (element: HTMLElement): string => element.querySelector('annotation[encoding="application/x-tex"]')?.textContent?.trim() ?? element.textContent ?? ''

const wrap = (mark: string, value: string): string => (value.trim() ? `${mark}${value.trim()}${mark}` : value)

const inline = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').replace(/\s+/g, ' ')
  if (!(node instanceof HTMLElement) || skipped(node)) return ''
  if (node.classList.contains('katex-display')) return `\n\n$$${tex(node)}$$\n\n`
  if (node.classList.contains('katex')) return `$${tex(node)}$`
  const inner = (): string => [...node.childNodes].map(inline).join('')
  switch (node.tagName) {
    case 'BR':
      return '  \n'
    case 'STRONG':
    case 'B':
      return wrap('**', inner())
    case 'EM':
    case 'I':
      return wrap('*', inner())
    case 'DEL':
    case 'S':
      return wrap('~~', inner())
    case 'CODE':
      return `\`${node.textContent ?? ''}\``
    case 'A': {
      const href = node.getAttribute('href')
      const label = inner().trim()
      return href && label ? `[${label}](${href})` : label
    }
    case 'IMG': {
      const source = node.getAttribute('src')
      return source ? `![${node.getAttribute('alt') ?? ''}](${source})` : ''
    }
    default:
      return inner()
  }
}

const fence = (pre: HTMLElement): string => {
  const raw = pre.closest('[data-chatgpt-copy-code]')?.getAttribute('data-chatgpt-copy-code') ?? (pre.querySelector('code') ?? pre).textContent ?? ''
  const label = pre.closest('[data-code-block]')?.querySelector('[data-markdown-copy="exclude"] .truncate')?.textContent ?? ''
  const language = label.trim().toLowerCase().replace(/\s+/g, '-')
  return `\`\`\`${language}\n${raw.replace(/\n$/, '')}\n\`\`\``
}

const table = (element: HTMLElement): string => {
  const rows = [...element.querySelectorAll('tr')].map((row) => [...row.children].map((cell) => inline(cell).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()))
  if (!rows.length) return ''
  const width = Math.max(...rows.map((row) => row.length))
  const line = (row: string[]): string => `| ${Array.from({ length: width }, (_, index) => row[index] ?? '').join(' | ')} |`
  const [head, ...body] = rows
  return [line(head ?? []), `| ${Array.from({ length: width }, () => '---').join(' | ')} |`, ...body.map(line)].join('\n')
}

const list = (element: HTMLElement, depth: number): string => {
  const ordered = element.tagName === 'OL'
  let index = Number.parseInt(element.getAttribute('start') ?? '1', 10) || 1
  const indent = '  '.repeat(depth)
  const lines: string[] = []
  for (const item of element.children) {
    if (!(item instanceof HTMLElement) || item.tagName !== 'LI' || skipped(item)) continue
    const own: string[] = []
    const nested: string[] = []
    for (const child of item.childNodes) {
      if (child instanceof HTMLElement && (child.tagName === 'UL' || child.tagName === 'OL')) nested.push(list(child, depth + 1))
      else if (child instanceof HTMLElement && child.tagName === 'PRE') nested.push(fence(child).split('\n').map((line) => `${indent}  ${line}`).join('\n'))
      else own.push(inline(child))
    }
    lines.push(`${indent}${ordered ? `${index++}.` : '-'} ${own.join('').trim()}`, ...nested.filter(Boolean))
  }
  return lines.join('\n')
}

const block = (element: HTMLElement): string => {
  if (skipped(element)) return ''
  const heading = HEADING.exec(element.tagName)
  if (heading) return `${'#'.repeat(Number(heading[1]))} ${[...element.childNodes].map(inline).join('').trim()}`
  switch (element.tagName) {
    case 'P':
      return [...element.childNodes].map(inline).join('').trim()
    case 'UL':
    case 'OL':
      return list(element, 0)
    case 'PRE':
      return fence(element)
    case 'HR':
      return '---'
    case 'TABLE':
      return table(element)
    case 'BLOCKQUOTE':
      return children(element).split('\n').map((line) => `> ${line}`).join('\n')
    default:
      return children(element)
  }
}

const children = (element: HTMLElement): string => {
  const parts: string[] = []
  let run = ''
  const flush = (): void => {
    if (run.trim()) parts.push(run.trim())
    run = ''
  }
  for (const child of element.childNodes) {
    if (child instanceof HTMLElement && BLOCKS.has(child.tagName)) {
      flush()
      const value = block(child)
      if (value) parts.push(value)
    } else {
      run += inline(child)
    }
  }
  flush()
  return parts.join('\n\n')
}

export const toMarkdown = (root: HTMLElement): string => children(root).replace(/\n{3,}/g, '\n\n').trim()
