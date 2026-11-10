import { estimateTokens } from '../../tokens'
import { splitText } from './splitter'

export interface PartTemplates {
  readonly header: string
  readonly final: string
}

export const DEFAULT_TEMPLATES: PartTemplates = {
  header: '[Part {{index}}/{{total}}] I am sending one long message in {{total}} parts. Do not answer yet. Reply only with "OK" until the final part.',
  final: '[Part {{index}}/{{total}} - final] This is the last part. The full message is now complete; respond to all parts now.'
}

export interface SplitPlan {
  parts: string[]
  tokens: number[]
  total: number
}

const fill = (template: string, index: number, total: number): string => template.replace(/\{\{index\}\}/g, String(index)).replace(/\{\{total\}\}/g, String(total))

export const planParts = (text: string, instruction: string, limit: number, balanced: boolean, templates: PartTemplates = DEFAULT_TEMPLATES): SplitPlan => {
  const total = estimateTokens(text)
  const tail = instruction.trim() ? `\n\n${instruction.trim()}` : ''
  if (total + estimateTokens(tail) <= limit) {
    const only = `${text}${tail}`
    return { parts: [only], tokens: [estimateTokens(only)], total }
  }
  const overhead = estimateTokens(templates.header) + estimateTokens(templates.final) + estimateTokens(tail) + 24
  const raw = splitText(text, { budget: Math.max(200, limit - overhead), balanced })
  const count = raw.length
  const parts = raw.map((chunk, index) => index === count - 1 ? `${fill(templates.final, index + 1, count)}\n\n${chunk}${tail}` : `${fill(templates.header, index + 1, count)}\n\n${chunk}`)
  return { parts, tokens: parts.map((part) => estimateTokens(part)), total }
}
