import type { Block, Inline } from './markdown'

type Font = 'regular' | 'bold' | 'italic' | 'bolditalic' | 'code'

interface Token {
  text: string
  font: Font
  width: number
  link?: string
}

interface Page {
  ops: string[]
  links: { rect: number[]; uri: string }[]
}

interface LineOptions {
  x: number
  width: number
  size: number
  leading: number
  bold?: boolean
  color?: string
  bar?: boolean
  label?: { text: string; x: number }
}

const FONTS: readonly Font[] = ['regular', 'bold', 'italic', 'bolditalic', 'code']
const BASE_FONT: Readonly<Record<Font, string>> = { regular: 'Helvetica', bold: 'Helvetica-Bold', italic: 'Helvetica-Oblique', bolditalic: 'Helvetica-BoldOblique', code: 'Courier' }
const W = 595.28
const H = 841.89
const M = 56
const CONTENT = W - 2 * M
const HEADING_SIZES = [22, 17, 14, 12.5, 11.5, 11]
const LINK_COLOR = '0.1 0.3 0.8'

const WIN_ANSI = new Map<number, number>([
  [0x20ac, 0x80], [0x201a, 0x82], [0x192, 0x83], [0x201e, 0x84], [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x2c6, 0x88], [0x2030, 0x89], [0x160, 0x8a],
  [0x2039, 0x8b], [0x152, 0x8c], [0x17d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x2dc, 0x98], [0x2122, 0x99], [0x161, 0x9a], [0x203a, 0x9b], [0x153, 0x9c], [0x17e, 0x9e], [0x178, 0x9f]
])

const encode = (text: string): string => Array.from(text, (char) => {
  const code = char.codePointAt(0) ?? 63
  if ((code >= 32 && code < 127) || (code >= 160 && code <= 255)) return char
  return String.fromCharCode(WIN_ANSI.get(code) ?? (code === 9 ? 32 : 63))
}).join('')

const pdfString = (text: string): string => `(${encode(text).replace(/[\\()]/g, '\\$&')})`

let canvas: CanvasRenderingContext2D | null = null

const measure = (text: string, font: Font, size: number): number => {
  if (font === 'code') return text.length * size * 0.6
  canvas ??= document.createElement('canvas').getContext('2d')
  if (!canvas) return text.length * size * 0.5
  canvas.font = `${font.includes('italic') ? 'italic ' : ''}${font.startsWith('bold') ? 'bold ' : ''}${size}px Arial, Helvetica, sans-serif`
  return canvas.measureText(text).width
}

const fontOf = (inline: Inline, forceBold: boolean): Font => {
  if (inline.code) return 'code'
  const bold = inline.bold || forceBold
  if (bold && inline.italic) return 'bolditalic'
  return bold ? 'bold' : inline.italic ? 'italic' : 'regular'
}

const tokenize = (inlines: readonly Inline[], size: number, forceBold = false): Token[] => inlines.flatMap((inline) => {
  const font = fontOf(inline, forceBold)
  return inline.text.split(/(\s+)/).filter(Boolean).map((part): Token => {
    const text = /^\s+$/.test(part) ? ' ' : part
    return { text, font, width: measure(text, font, size), link: inline.link }
  })
})

const hardSplit = (token: Token, maxWidth: number, size: number): Token[] => {
  const pieces: Token[] = []
  let current = ''
  for (const char of token.text) {
    if (current && measure(current + char, token.font, size) > maxWidth) {
      pieces.push({ ...token, text: current, width: measure(current, token.font, size) })
      current = ''
    }
    current += char
  }
  if (current) pieces.push({ ...token, text: current, width: measure(current, token.font, size) })
  return pieces
}

const wrap = (tokens: readonly Token[], maxWidth: number, size: number): Token[][] => {
  const lines: Token[][] = []
  let line: Token[] = []
  let width = 0
  const push = (): void => {
    while (line.at(-1)?.text === ' ') line.pop()
    if (line.length) lines.push(line)
    line = []
    width = 0
  }
  for (const token of tokens) {
    if (token.text === ' ') {
      if (line.length) {
        line.push(token)
        width += token.width
      }
      continue
    }
    if (token.width > maxWidth) {
      push()
      for (const piece of hardSplit(token, maxWidth, size)) lines.push([piece])
      continue
    }
    if (width + token.width > maxWidth && line.length) push()
    line.push(token)
    width += token.width
  }
  push()
  return lines.length ? lines : [[]]
}

class Layout {
  readonly pages: Page[] = [{ ops: [], links: [] }]
  private y = M

  private get page(): Page {
    return this.pages.at(-1)!
  }

  private ensure(height: number): void {
    if (this.y + height <= H - M) return
    this.pages.push({ ops: [], links: [] })
    this.y = M
  }

  private rect(x: number, top: number, width: number, height: number, fill: string): void {
    this.page.ops.push(`${fill} ${x.toFixed(2)} ${(H - top - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`)
  }

  private line(tokens: readonly Token[], x: number, size: number, color: string): void {
    const baseline = H - (this.y + size)
    let cursor = x
    for (const token of tokens) {
      if (token.text !== ' ') {
        const fill = token.link ? `${LINK_COLOR} rg` : color
        this.page.ops.push(`BT ${fill} /F${FONTS.indexOf(token.font) + 1} ${size} Tf ${cursor.toFixed(2)} ${baseline.toFixed(2)} Td ${pdfString(token.text)} Tj ET`)
        if (token.link) {
          const underline = (baseline - 1.5).toFixed(2)
          this.page.ops.push(`${LINK_COLOR} RG 0.5 w ${cursor.toFixed(2)} ${underline} m ${(cursor + token.width).toFixed(2)} ${underline} l S`)
          this.page.links.push({ rect: [cursor, baseline - 2, cursor + token.width, baseline + size], uri: token.link.replace(/[^\x21-\x7e]/g, '') })
        }
      }
      cursor += token.width
    }
  }

  private flow(inlines: readonly Inline[], { x, width, size, leading, bold = false, color = '0.1 g', bar = false, label }: LineOptions): void {
    wrap(tokenize(inlines, size, bold), width, size).forEach((tokens, index) => {
      this.ensure(leading)
      if (bar) this.rect(x - 10, this.y, 2.5, leading, '0.8 g')
      if (index === 0 && label) this.line([{ text: label.text, font: 'regular', width: measure(label.text, 'regular', size) }], label.x, size, color)
      this.line(tokens, x, size, color)
      this.y += leading
    })
  }

  private code(text: string): void {
    const size = 9
    const leading = 12.5
    const columns = Math.floor((CONTENT - 20) / (size * 0.6))
    const lines = text.replace(/\t/g, '  ').split('\n').flatMap((line) => {
      const out: string[] = []
      for (let index = 0; index < Math.max(line.length, 1); index += columns) out.push(line.slice(index, index + columns))
      return out
    })
    const pad = (): void => {
      this.ensure(6)
      this.rect(M, this.y, CONTENT, 6, '0.955 g')
      this.y += 6
    }
    this.y += 2
    pad()
    for (const line of lines) {
      this.ensure(leading)
      this.rect(M, this.y, CONTENT, leading, '0.955 g')
      this.line([{ text: line, font: 'code', width: 0 }], M + 10, size, '0.15 g')
      this.y += leading
    }
    pad()
    this.y += 8
  }

  private table(block: Extract<Block, { type: 'table' }>): void {
    const columns = Math.max(1, block.header.length)
    const width = CONTENT / columns
    const size = 9.5
    const leading = 13
    const rows = [block.header, ...block.rows]
    rows.forEach((row, rowIndex) => {
      const cells = Array.from({ length: columns }, (_, index) => wrap(tokenize(row[index] ?? [], size, rowIndex === 0), width - 8, size))
      const height = Math.max(...cells.map((lines) => lines.length)) * leading + 8
      this.ensure(height)
      cells.forEach((lines, index) => {
        const x = M + index * width
        if (rowIndex === 0) this.rect(x, this.y, width, height, '0.94 g')
        this.page.ops.push(`0.8 G 0.5 w ${x.toFixed(2)} ${(H - this.y - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`)
        const top = this.y
        lines.forEach((tokens, lineIndex) => {
          this.y = top + 4 + lineIndex * leading
          this.line(tokens, x + 4, size, '0.1 g')
        })
        this.y = top
      })
      this.y += height
    })
    this.y += 8
  }

  render(blocks: readonly Block[]): void {
    for (const block of blocks) {
      switch (block.type) {
        case 'heading': {
          const size = HEADING_SIZES[block.level - 1] ?? 11
          this.y += block.level <= 2 ? 14 : 8
          this.ensure(size * 3)
          this.flow(block.inlines, { x: M, width: CONTENT, size, leading: size * 1.3, bold: true, color: '0 g' })
          this.y += 4
          break
        }
        case 'paragraph':
          this.flow(block.inlines, { x: M, width: CONTENT, size: 11, leading: 15.5 })
          this.y += 6
          break
        case 'item': {
          const x = M + 18 + block.depth * 16
          this.flow(block.inlines, { x, width: W - M - x, size: 11, leading: 15.5, label: { text: block.ordered ? `${block.number}.` : '•', x: x - 14 } })
          this.y += 2
          break
        }
        case 'quote':
          this.flow(block.inlines, { x: M + 14, width: CONTENT - 14, size: 11, leading: 15.5, color: '0.35 g', bar: true })
          this.y += 6
          break
        case 'rule':
          this.ensure(14)
          this.page.ops.push(`0.8 G 0.75 w ${M} ${(H - this.y - 6).toFixed(2)} m ${W - M} ${(H - this.y - 6).toFixed(2)} l S`)
          this.y += 14
          break
        case 'code':
          this.code(block.text)
          break
        case 'table':
          this.table(block)
          break
      }
    }
  }

  finish(): void {
    this.pages.forEach((page, index) => {
      page.ops.push(`BT 0.5 g /F1 8 Tf ${(W / 2 - 14).toFixed(2)} 28 Td ${pdfString(`${index + 1} / ${this.pages.length}`)} Tj ET`)
    })
  }
}

export const buildPdf = (blocks: readonly Block[], title: string): Uint8Array => {
  const layout = new Layout()
  layout.render(blocks)
  layout.finish()
  const objects: string[] = ['', '']
  const add = (body: string): number => objects.push(body)
  const fontIds = FONTS.map((font) => add(`<< /Type /Font /Subtype /Type1 /BaseFont /${BASE_FONT[font]} /Encoding /WinAnsiEncoding >>`))
  const resources = `<< /Font << ${fontIds.map((id, index) => `/F${index + 1} ${id} 0 R`).join(' ')} >> >>`
  const info = add(`<< /Title ${pdfString(title)} /Producer (Better Perplexity) >>`)
  const pageIds = layout.pages.map((page) => {
    const stream = page.ops.join('\n')
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    const annots = page.links.map((link) => add(`<< /Type /Annot /Subtype /Link /Rect [${link.rect.map((value) => value.toFixed(2)).join(' ')}] /Border [0 0 0] /A << /S /URI /URI (${link.uri.replace(/[\\()]/g, '\\$&')}) >> >>`))
    const annotations = annots.length ? ` /Annots [${annots.map((id) => `${id} 0 R`).join(' ')}]` : ''
    return add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources ${resources} /Contents ${content} 0 R${annotations} >>`)
  })
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
  const offsets = objects.map((body, index) => {
    const offset = out.length
    out += `${index + 1} 0 obj\n${body}\nendobj\n`
    return offset
  })
  const xref = out.length
  const table = offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${table}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Uint8Array.from(out, (char) => char.charCodeAt(0) & 0xff)
}