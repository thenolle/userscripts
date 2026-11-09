export interface Inline {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  link?: string
  image?: string
}

export type AlertKind = 'note' | 'tip' | 'important' | 'warning' | 'caution'

export type Block =
  | { type: 'heading'; level: number; id: string; text: string; inlines: Inline[] }
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'code'; language: string; title: string | null; text: string }
  | { type: 'item'; ordered: boolean; number: number; depth: number; checked: boolean | null; inlines: Inline[] }
  | { type: 'quote'; alert: AlertKind | null; inlines: Inline[] }
  | { type: 'rule' }
  | { type: 'table'; header: Inline[][]; rows: Inline[][][] }

type Style = Omit<Inline, 'text'>

const INLINE = /`(?<code>[^`]+)`|!\[(?<alt>[^\]]*)\]\((?<src>[^)\s]+)\)|\[(?<label>[^\]]*)\]\((?<url>[^)\s]+)(?:\s+"[^"]*")?\)|\*\*(?<bold>.+?)\*\*|__(?<bold2>.+?)__|\*(?<italic>[^*\s][^*]*?)\*|\b_(?<italic2>[^_\s][^_]*?)_\b/g
const FENCE = /^\s*(`{3,}|~{3,})\s*([\w+#.-]*)\s*(.*)$/
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/
const RULE = /^\s*([-*_])(?:\s*\1){2,}\s*$/
const ITEM = /^(\s*)([-*+]|\d+[.)])\s+(?:\[([ xX])\]\s+)?(.*)$/
const QUOTE = /^\s*>\s?(.*)$/
const ALERT = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i
const SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*\|?\s*$/

export const slugify = (text: string): string => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section'

export const parseInlines = (text: string, base: Style = {}): Inline[] => {
  const result: Inline[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0
    const g = match.groups ?? {}
    if (index > last) result.push({ ...base, text: text.slice(last, index) })
    if (g['code'] !== undefined) result.push({ ...base, text: g['code'], code: true })
    else if (g['src'] !== undefined) result.push({ ...base, text: g['alt'] ?? '', image: g['src'] })
    else if (g['url'] !== undefined) result.push(...parseInlines(g['label'] || g['url'], { ...base, link: g['url'] }))
    else if (g['bold'] !== undefined || g['bold2'] !== undefined) result.push(...parseInlines(g['bold'] ?? g['bold2'] ?? '', { ...base, bold: true }))
    else result.push(...parseInlines(g['italic'] ?? g['italic2'] ?? '', { ...base, italic: true }))
    last = index + match[0].length
  }
  if (last < text.length) result.push({ ...base, text: text.slice(last) })
  return result
}

export const plain = (inlines: readonly Inline[]): string => inlines.map((inline) => inline.text).join('')

const splitRow = (line: string): string[] => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())

export const parseBlocks = (markdown: string): Block[] => {
  const lines = markdown.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '').split('\n')
  const blocks: Block[] = []
  const used = new Map<string, number>()
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
      blocks.push({ type: 'code', language: (fence[2] ?? '').toLowerCase(), title: /title="([^"]*)"/.exec(fence[3] ?? '')?.[1] ?? null, text: body.join('\n') })
      continue
    }
    if (!line.trim()) {
      flush()
      continue
    }
    const heading = HEADING.exec(line)
    if (heading) {
      flush()
      const inlines = parseInlines(heading[2] ?? '')
      const text = plain(inlines)
      const slug = slugify(text)
      const count = used.get(slug) ?? 0
      used.set(slug, count + 1)
      blocks.push({ type: 'heading', level: heading[1]!.length, id: count ? `${slug}-${count}` : slug, text, inlines })
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
      blocks.push({
        type: 'item',
        ordered: /\d/.test(item[2]!),
        number: Number.parseInt(item[2]!, 10) || 1,
        depth: Math.min(4, Math.floor((item[1] ?? '').length / 2)),
        checked: item[3] === undefined ? null : item[3] !== ' ',
        inlines: parseInlines(item[4] ?? '')
      })
      continue
    }
    const quote = QUOTE.exec(line)
    if (quote) {
      flush()
      const previous = blocks.at(-1)
      const alert = ALERT.exec(quote[1] ?? '')?.[1]?.toLowerCase() as AlertKind | undefined
      if (alert) blocks.push({ type: 'quote', alert, inlines: [] })
      else if (previous?.type === 'quote') previous.inlines.push(...(previous.inlines.length ? [{ text: ' ' }] : []), ...parseInlines(quote[1] ?? ''))
      else blocks.push({ type: 'quote', alert: null, inlines: parseInlines(quote[1] ?? '') })
      continue
    }
    const previous = blocks.at(-1)
    if (!paragraph.length && previous?.type === 'item' && /^\s{2,}\S/.test(line)) previous.inlines.push({ text: ' ' }, ...parseInlines(line.trim()))
    else paragraph.push(line.trim())
  }
  flush()
  return blocks
}

export const parseFrontMatter = (raw: string): { data: Record<string, string>; body: string } => {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw.replace(/\r\n?/g, '\n'))
  if (!match) return { data: {}, body: raw }
  const data: Record<string, string> = {}
  for (const line of (match[1] ?? '').split('\n')) {
    const pair = /^([\w-]+):\s*(.*)$/.exec(line)
    if (pair) data[pair[1]!] = (pair[2] ?? '').replace(/^["']|["']$/g, '')
  }
  return { data, body: raw.slice(match[0].length) }
}