import { estimateTokens } from '@nolly/ai'

interface CodeAtom {
  kind: 'code'
  open: string
  close: string
  body: string[]
}

interface TextAtom {
  kind: 'text'
  lines: string[]
}

type Atom = CodeAtom | TextAtom

export interface SplitOptions {
  budget: number
  balanced: boolean
}

const FENCE_OPEN = /^\s*(`{3,}|~{3,})/
const SENTENCE_BREAK = /(?<=[.!?])\s+/
const CHARS_PER_TOKEN = 3

const atomText = (atom: Atom): string => (atom.kind === 'code' ? [atom.open, ...atom.body, atom.close].join('\n') : atom.lines.join('\n'))
const atomTokens = (atom: Atom): number => estimateTokens(atomText(atom))

export const parseAtoms = (text: string): Atom[] => {
  const atoms: Atom[] = []
  let paragraph: string[] = []
  let fence: { open: string; marker: string; body: string[] } | null = null
  const flush = (): void => {
    if (paragraph.length) atoms.push({ kind: 'text', lines: paragraph })
    paragraph = []
  }
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (fence) {
      const trimmed = line.trim()
      if (trimmed.startsWith(fence.marker) && /^[`~]+$/.test(trimmed)) {
        atoms.push({ kind: 'code', open: fence.open, close: trimmed, body: fence.body })
        fence = null
      } else {
        fence.body.push(line)
      }
      continue
    }
    const opening = FENCE_OPEN.exec(line)
    if (opening) {
      flush()
      fence = { open: line.trim(), marker: opening[1]!, body: [] }
      continue
    }
    if (line.trim() === '') flush()
    else paragraph.push(line)
  }
  flush()
  if (fence) atoms.push({ kind: 'code', open: fence.open, close: fence.marker, body: fence.body })
  return atoms
}

const hardSplit = (text: string, budget: number): string[] => {
  const size = Math.max(40, Math.floor(budget * CHARS_PER_TOKEN))
  const pieces: string[] = []
  for (let index = 0; index < text.length; index += size) pieces.push(text.slice(index, index + size))
  return pieces
}

const pack = (units: readonly string[], budget: number, joiner: string, asCode: boolean): string[] => {
  const chunks: string[] = []
  let current: string[] = []
  let used = 0
  const flush = (): void => {
    if (current.length) chunks.push(current.join(joiner))
    current = []
    used = 0
  }
  for (const unit of units.flatMap((entry) => (estimateTokens(entry, asCode) > budget ? hardSplit(entry, budget) : [entry]))) {
    const size = estimateTokens(unit, asCode) + 1
    if (current.length && used + size > budget) flush()
    current.push(unit)
    used += size
  }
  flush()
  return chunks
}

const splitOversized = (atom: Atom, budget: number): Atom[] => {
  if (atom.kind === 'code') {
    const room = Math.max(40, budget - estimateTokens(`${atom.open}\n${atom.close}`, true))
    return pack(atom.body, room, '\n', true).map((chunk): Atom => ({ kind: 'code', open: atom.open, close: atom.close, body: chunk.split('\n') }))
  }
  const single = atom.lines.length === 1
  const units = single ? (atom.lines[0] ?? '').split(SENTENCE_BREAK) : atom.lines
  return pack(units, budget, single ? ' ' : '\n', false).map((chunk): Atom => ({ kind: 'text', lines: [chunk] }))
}

export const splitText = (text: string, { budget, balanced }: SplitOptions): string[] => {
  const atoms = parseAtoms(text).flatMap((atom) => (atomTokens(atom) > budget ? splitOversized(atom, budget) : [atom]))
  if (!atoms.length) return []
  const sizes = atoms.map((atom) => atomTokens(atom) + 2)
  const total = sizes.reduce((sum, size) => sum + size, 0)
  const count = Math.max(1, Math.ceil(total / budget))
  const cap = balanced ? Math.min(budget, Math.ceil((total / count) * 1.15)) : budget
  const parts: string[][] = []
  let current: string[] = []
  let used = 0
  atoms.forEach((atom, index) => {
    const size = sizes[index]!
    if (current.length && used + size > cap) {
      parts.push(current)
      current = []
      used = 0
    }
    current.push(atomText(atom))
    used += size
  })
  if (current.length) parts.push(current)
  return parts.map((part) => part.join('\n\n'))
}