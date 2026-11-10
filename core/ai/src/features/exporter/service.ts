import { copyText } from '../../clipboard'
import { saveFile } from '../../download'
import { platform } from '../../platform'
import { reformatCitations, stripLogo } from './citations'
import { buildDocx } from './docx'
import { formatMarkdown, parseBlocks } from './markdown'
import { openPdfPreview } from './pdf'
import type { ExportSettings } from './settings'
import { blocksToText } from './text'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const filenameBase = (): string => {
	const source = platform().exporter
	const fallback = `${source.name.toLowerCase()}-thread`
	return (source.slug() ?? fallback).replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 80) || fallback
}

const pageTitle = (): string => {
	const { name } = platform().exporter
	const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	return document.title.replace(new RegExp(`\\s*[-–|]\\s*${escapedName}\\s*$`, 'i'), '').trim() || `${name} thread`
}

const loadMarkdown = async (settings: ExportSettings): Promise<string> => {
	const source = platform().exporter
	const raw = await source.markdown()
	const text = source.citations ? reformatCitations(settings.stripLogo ? stripLogo(raw) : raw, settings.style) : raw
	return formatMarkdown(text, { title: pageTitle(), url: location.href, source: source.name })
}

export const runExport = async (settings: ExportSettings, action: 'download' | 'copy'): Promise<string> => {
	if (action === 'copy' && (settings.format === 'pdf' || settings.format === 'docx')) {
		return 'Copy works for Markdown, plain text and JSON.'
	}

	const preview = settings.format === 'pdf' ? window.open('', '_blank') : null
	if (settings.format === 'pdf' && !preview) throw new Error('Allow popups for this site, then open the PDF preview again.')
	if (preview) preview.opener = null

	try {
		const base = filenameBase()

		if (settings.format === 'json') {
			const json = await platform().exporter.json()
			if (action === 'copy') return await copyText(json) ? 'Copied JSON.' : 'Copy failed.'
			saveFile(`${base}.json`, json, 'application/json')
			return 'Download requested.'
		}

		const markdown = await loadMarkdown(settings)
		const blocks = parseBlocks(markdown)

		if (settings.format === 'pdf') {
			if (!preview || preview.closed) throw new Error('The PDF preview was closed.')
			openPdfPreview(preview, blocks, pageTitle())
			return 'Preview opened. Choose Print / Save as PDF in the new tab.'
		}

		if (settings.format === 'md' || settings.format === 'txt') {
			const text = settings.format === 'md' ? markdown : blocksToText(blocks)
			if (action === 'copy') return await copyText(text) ? 'Copied.' : 'Copy failed.'
			saveFile(`${base}.${settings.format}`, text, settings.format === 'md' ? 'text/markdown' : 'text/plain')
			return 'Download requested.'
		}

		saveFile(`${base}.docx`, buildDocx(blocks) as BlobPart, DOCX_MIME)
		return 'Download requested.'
	} catch (error) {
		preview?.close()
		throw error
	}
}
