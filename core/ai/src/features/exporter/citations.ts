export type CitationStyle = 'parenthesized' | 'inline' | 'endnotes' | 'footnotes' | 'named' | 'none'

interface Source {
  url: string
  title: string
}

const DEFINITION = /^\[\^(\w+)\]:[ \t]*(.*)$/gm
const REFERENCE = /\[\^(\w+)\]/g

const hostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const parseSource = (rest: string): Source | null => {
  const link = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/.exec(rest)
  if (link?.[2]) return { url: link[2], title: link[1] || hostname(link[2]) }
  const bare = /https?:\/\/\S+/.exec(rest)
  return bare ? { url: bare[0], title: hostname(bare[0]) } : null
}

export const stripLogo = (markdown: string): string => markdown.replace(/^\s*<img[^>]*>\s*/i, '')

export const reformatCitations = (markdown: string, style: CitationStyle): string => {
  const definitions = new Map<string, Source>()
  const body = markdown.replace(DEFINITION, (_line, id: string, rest: string) => {
    const source = parseSource(rest)
    if (source) definitions.set(id, source)
    return ''
  })
  const numbers = new Map<string, number>()
  const sources: Source[] = []
  const numberOf = (source: Source): number => {
    let number = numbers.get(source.url)
    if (number === undefined) {
      sources.push(source)
      number = sources.length
      numbers.set(source.url, number)
    }
    return number
  }
  const text = body.replace(REFERENCE, (match, id: string) => {
    const source = definitions.get(id)
    if (!source) return match
    if (style === 'none') return ''
    const number = numberOf(source)
    switch (style) {
      case 'inline': return `[${number}](${source.url})`
      case 'parenthesized': return `([${number}](${source.url}))`
      case 'named': return `([${hostname(source.url)}](${source.url}))`
      case 'footnotes': return `[^${number}]`
      default: return `[${number}]`
    }
  })
  let tail = ''
  if (style === 'endnotes') tail = `\n\n## Sources\n\n${sources.map((source, index) => `${index + 1}. [${source.title}](${source.url})`).join('\n')}`
  if (style === 'footnotes') tail = `\n\n${sources.map((source, index) => `[^${index + 1}]: ${source.url}`).join('\n')}`
  return `${text.replace(/\n{3,}/g, '\n\n').trim()}${sources.length ? tail : ''}\n`
}