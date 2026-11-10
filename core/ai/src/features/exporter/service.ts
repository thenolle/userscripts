import { copyText } from '../../clipboard'
import { saveFile } from '../../download'
import { platform } from '../../platform'
import { reformatCitations, stripLogo } from './citations'
import { buildDocx } from './docx'
import { formatMarkdown, parseBlocks } from './markdown'
import { buildPdf } from './pdf'
import type { ExportSettings } from './settings'
import { blocksToText } from './text'

const MIME = { docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', pdf: 'application/pdf' } as const

const fallbackName = (): string => `${platform().exporter.name.toLowerCase()}-thread`

const filenameBase = (): string => (platform().exporter.slug() ?? fallbackName()).replace(/[^\w-]+/g, '-').slice(0, 60) || fallbackName()

const pageTitle = (): string => {
  const { name } = platform().exporter
  return document.title.replace(new RegExp(`\\s*[-–|]\\s*${name}\\s*$`, 'i'), '').trim() || `${name} thread`
}

const loadMarkdown = async (settings: ExportSettings): Promise<string> => {
  const source = platform().exporter
  const raw = await source.markdown()
  const text = source.citations ? reformatCitations(settings.stripLogo ? stripLogo(raw) : raw, settings.style) : raw
  return formatMarkdown(text, { title: pageTitle(), url: location.href, source: source.name })
}

export const runExport = async (settings: ExportSettings, action: 'download' | 'copy'): Promise<string> => {
  const base = filenameBase()
  if (settings.format === 'json') {
    const json = await platform().exporter.json()
    if (action === 'copy') return (await copyText(json)) ? 'Copied JSON.' : 'Copy failed.'
    saveFile(`${base}.json`, json, 'application/json')
    return 'Downloaded.'
  }
  const markdown = await loadMarkdown(settings)
  const blocks = parseBlocks(markdown)
  if (settings.format === 'md' || settings.format === 'txt') {
    const text = settings.format === 'md' ? markdown : blocksToText(blocks)
    if (action === 'copy') return (await copyText(text)) ? 'Copied.' : 'Copy failed.'
    saveFile(`${base}.${settings.format}`, text, settings.format === 'md' ? 'text/markdown' : 'text/plain')
    return 'Downloaded.'
  }
  if (action === 'copy') return 'Copy works for Markdown, plain text and JSON.'
  const bytes = settings.format === 'docx' ? buildDocx(blocks) : buildPdf(blocks, pageTitle())
  saveFile(`${base}.${settings.format}`, bytes as BlobPart, MIME[settings.format])
  return 'Downloaded.'
}
