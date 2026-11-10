import { copyText, saveFile } from '@nolly/ai'
import { currentThreadSlug, exportThread, fetchThreadJson } from './api'
import { reformatCitations, stripLogo } from './citations'
import { buildDocx } from './docx'
import { formatMarkdown, parseBlocks } from './markdown'
import { buildPdf } from './pdf'
import type { ExportSettings } from './settings'
import { blocksToText } from './text'

const MIME = { docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', pdf: 'application/pdf' } as const

const filenameBase = (): string => (currentThreadSlug() ?? 'perplexity-thread').replace(/[^\w-]+/g, '-').slice(0, 60) || 'perplexity-thread'

const pageTitle = (): string => document.title.replace(/\s*[-–|]\s*Perplexity\s*$/i, '').trim() || 'Perplexity thread'

const loadMarkdown = async (settings: ExportSettings, base: string): Promise<string> => {
  const file = await exportThread('md', base)
  const raw = new TextDecoder().decode(file.bytes)
  return formatMarkdown(reformatCitations(settings.stripLogo ? stripLogo(raw) : raw, settings.style), { title: pageTitle(), url: location.href })
}

export const runExport = async (settings: ExportSettings, action: 'download' | 'copy'): Promise<string> => {
  const base = filenameBase()
  if (settings.format === 'json') {
    const json = await fetchThreadJson()
    if (action === 'copy') return (await copyText(json)) ? 'Copied JSON.' : 'Copy failed.'
    saveFile(`${base}.json`, json, 'application/json')
    return 'Downloaded.'
  }
  const markdown = await loadMarkdown(settings, base)
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