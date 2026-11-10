export interface Inline {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  link?: string
}

export type Block =
  | { type: 'heading'; level: number; inlines: Inline[] }
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'code'; language: string; text: string }
  | { type: 'item'; ordered: boolean; number: number; depth: number; inlines: Inline[] }
  | { type: 'quote'; inlines: Inline[] }
  | { type: 'rule' }
  | { type: 'table'; header: Inline[][]; rows: Inline[][][] }

type Style = Omit<Inline, 'text'>

const INLINE = /`(?<code>[^`]+)`|\*\*(?<bold>.+?)\*\*|__(?<bold2>.+?)__|\[(?<label>[^\]]*)\]\((?<url>[^)\s]+)\)|\*(?<italic>[^*\s][^*]*?)\*|\b_(?<italic2>[^_\s][^_]*?)_\b|\[\^(?<note>\w+)\]/g
const FENCE = /^\s*(`{3,}|~{3,})\s*([\w+#.-]*)/
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/
const RULE = /^\s*([-*_])(?:\s*\1){2,}\s*$/
const ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/
const QUOTE = /^\s*>\s?(.*)$/
const SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*\|?\s*$/

export const parseInlines = (text: string, base: Style = {}): Inline[] => {
  const result: Inline[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0
    const g = match.groups ?? {}
    if (index > last) result.push({ ...base, text: text.slice(last, index) })
    if (g['code'] !== undefined) result.push({ ...base, text: g['code'], code: true })
    else if (g['bold'] !== undefined || g['bold2'] !== undefined) result.push(...parseInlines(g['bold'] ?? g['bold2'] ?? '', { ...base, bold: true }))
    else if (g['label'] !== undefined && g['url'] !== undefined) result.push(...parseInlines(g['label'] || g['url'], { ...base, link: g['url'] }))
    else if (g['italic'] !== undefined || g['italic2'] !== undefined) result.push(...parseInlines(g['italic'] ?? g['italic2'] ?? '', { ...base, italic: true }))
    else if (g['note'] !== undefined) result.push({ ...base, text: `[${g['note']}]` })
    last = index + match[0].length
  }
  if (last < text.length) result.push({ ...base, text: text.slice(last) })
  return result
}

const splitRow = (line: string): string[] => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())

export const parseBlocks = (markdown: string): Block[] => {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let paragraph: string[] = []
  const flush = (): void => {
    if (paragraph.length) blocks.push({ type: 'paragraph', inlines: parseInlines(paragraph.join(' ')) })
    paragraph = []
  }
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!
    const fence = FENCE.exec(line)
    if (fence) {
      flush()
      const marker = fence[1]!
      const body: string[] = []
      for (index++; index < lines.length; index++) {
        const trimmed = lines[index]!.trim()
        if (trimmed.startsWith(marker) && /^[`~]+$/.test(trimmed)) break
        body.push(lines[index]!)
      }
      blocks.push({ type: 'code', language: fence[2] ?? '', text: body.join('\n') })
      continue
    }
    if (!line.trim()) {
      flush()
      continue
    }
    const heading = HEADING.exec(line)
    if (heading) {
      flush()
      blocks.push({ type: 'heading', level: heading[1]!.length, inlines: parseInlines(heading[2] ?? '') })
      continue
    }
    if (RULE.test(line)) {
      flush()
      blocks.push({ type: 'rule' })
      continue
    }
    if (line.includes('|') && SEPARATOR.test(lines[index + 1] ?? '')) {
      flush()
      const header = splitRow(line).map((cell) => parseInlines(cell))
      const rows: Inline[][][] = []
      for (index += 2; index < lines.length && lines[index]!.includes('|') && lines[index]!.trim(); index++) rows.push(splitRow(lines[index]!).map((cell) => parseInlines(cell)))
      index--
      blocks.push({ type: 'table', header, rows })
      continue
    }
    const item = ITEM.exec(line)
    if (item) {
      flush()
      blocks.push({ type: 'item', ordered: /\d/.test(item[2]!), number: Number.parseInt(item[2]!, 10) || 1, depth: Math.min(4, Math.floor((item[1] ?? '').length / 2)), inlines: parseInlines(item[3] ?? '') })
      continue
    }
    const quote = QUOTE.exec(line)
    if (quote) {
      flush()
      const previous = blocks.at(-1)
      if (previous?.type === 'quote') previous.inlines.push({ text: ' ' }, ...parseInlines(quote[1] ?? ''))
      else blocks.push({ type: 'quote', inlines: parseInlines(quote[1] ?? '') })
      continue
    }
    const previous = blocks.at(-1)
    if (!paragraph.length && previous?.type === 'item' && /^\s{2,}\S/.test(line)) previous.inlines.push({ text: ' ' }, ...parseInlines(line.trim()))
    else paragraph.push(line.trim())
  }
  flush()
  return blocks
}

const BLOCK_START = /^(#{1,6}\s|---+\s*$|\s*(?:[-*+]|\d+[.)])\s|\s*\|)/

export const formatMarkdown = (markdown: string, meta: { title: string; url: string }): string => {
  const cleaned: string[] = []
  let fenced = false
  for (const raw of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*(```|~~~)/.test(raw)) {
      fenced = !fenced
      cleaned.push(raw.trimEnd())
      continue
    }
    if (fenced) {
      cleaned.push(raw)
      continue
    }
    cleaned.push(raw.replace(/<div[^>]*>\s*⁂\s*<\/div>/g, '---').replace(/<img[^>]*>/gi, '').replace(/<\/?(?:div|span|br|p|center)[^>]*>/gi, '').trimEnd())
  }
  const spaced: string[] = []
  fenced = false
  for (const line of cleaned) {
    const fence = /^\s*(```|~~~)/.test(line)
    const opening = fence && !fenced
    if (fence) fenced = !fenced
    const previous = spaced.at(-1)
    const needsBreak = !fenced && !fence && previous !== undefined && previous.trim() !== '' && line.trim() !== '' && BLOCK_START.test(line) && !BLOCK_START.test(previous)
    if ((opening || needsBreak) && previous !== undefined && previous.trim() !== '') spaced.push('')
    if (fenced || fence || line.trim() !== '' || spaced.at(-1)?.trim() !== '') spaced.push(line)
  }
  const body = spaced.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  const stamp = `_Exported from Perplexity on ${new Date().toLocaleString()} · ${meta.url}_`
  const firstLine = body.split('\n', 1)[0] ?? ''
  if (firstLine.startsWith('# ')) return `${firstLine}\n\n${stamp}\n\n${body.slice(firstLine.length).trim()}\n`
  return `# ${meta.title}\n\n${stamp}\n\n---\n\n${body}\n`
}