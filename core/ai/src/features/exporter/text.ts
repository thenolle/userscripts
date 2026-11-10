import type { Block, Inline } from './markdown'

const plain = (inlines: Inline[]): string => inlines.map((inline) => (inline.link && inline.link !== inline.text ? `${inline.text} (${inline.link})` : inline.text)).join('')

export const blocksToText = (blocks: readonly Block[]): string => {
  const out: string[] = []
  for (const block of blocks) {
    switch (block.type) {
      case 'heading': {
        const text = plain(block.inlines)
        out.push(block.level <= 2 ? `${text}\n${(block.level === 1 ? '=' : '-').repeat(Math.max(3, text.length))}` : text)
        break
      }
      case 'paragraph':
        out.push(plain(block.inlines))
        break
      case 'code':
        out.push(block.text.split('\n').map((line) => `    ${line}`).join('\n'))
        break
      case 'item':
        out.push(`${'  '.repeat(block.depth)}${block.ordered ? `${block.number}.` : '-'} ${plain(block.inlines)}`)
        break
      case 'quote':
        out.push(`> ${plain(block.inlines)}`)
        break
      case 'rule':
        out.push('-'.repeat(48))
        break
      case 'table':
        out.push([block.header, ...block.rows].map((row) => row.map(plain).join(' | ')).join('\n'))
        break
    }
  }
  return `${out.join('\n\n').replace(/\n{3,}/g, '\n\n')}\n`
}