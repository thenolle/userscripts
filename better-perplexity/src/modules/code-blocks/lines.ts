import { createElement } from '../../core/dom'

interface LineParts {
  line: HTMLElement
  text: HTMLElement
}

interface OpenLine {
  line: HTMLElement
  tip: HTMLElement
}

export const createLine = (kind = ''): LineParts => {
  const line = createElement('span', kind ? `bp-line ${kind}` : 'bp-line')
  const text = createElement('span', 'bp-text')
  line.append(createElement('span', 'bp-num'), text)
  return { line, text }
}

const lineKind = (line: string): string => {
  if (line.startsWith('@@')) return 'hunk'
  if (line.startsWith('+') && !line.startsWith('+++')) return 'add'
  if (line.startsWith('-') && !line.startsWith('---')) return 'del'
  return ''
}

export const renderPlainLines = (source: string, diff: boolean): HTMLElement[] =>source.split('\n').map((content) => {
    const { line, text } = createLine(diff ? lineKind(content) : '')
    text.textContent = content
    return line
  })

const startLine = (open: readonly Element[]): OpenLine => {
  const { line, text } = createLine()
  let tip = text
  for (const ancestor of open) {
    const clone = ancestor.cloneNode(false) as HTMLElement
    tip.appendChild(clone)
    tip = clone
  }
  return { line, tip }
}

export const splitHighlighted = (root: Node, expected: number): HTMLElement[] => {
  const open: Element[] = []
  const lines: HTMLElement[] = []
  let current = startLine(open)
  lines.push(current.line)
  const visit = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const nodeContent = node.textContent ?? ''
      nodeContent.split('\n').forEach((segment, index) => {
        if (index > 0) {
          current = startLine(open)
          lines.push(current.line)
        }
        if (segment) current.tip.appendChild(document.createTextNode(segment))
      })
      return
    }
    if (!(node instanceof Element)) return
    open.push(node)
    const clone = node.cloneNode(false) as HTMLElement
    current.tip.appendChild(clone)
    current.tip = clone
    node.childNodes.forEach(visit)
    open.pop()
    current.tip = current.tip.parentElement ?? current.line
  }
  root.childNodes.forEach(visit)
  while (lines.length > expected && !lines.at(-1)?.textContent) lines.pop()
  return lines
}