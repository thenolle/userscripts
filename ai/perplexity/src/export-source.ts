import type { ExportSource } from '@nolly/ai'
import { getPageWindow } from '@nolly/core'
import { storage } from './core/storage'
import { readCookieAccountId } from './modules/usage-status/account-cookie'

const ACCOUNT_KEY = 'usage-status:account-id'
const TIMEOUT = 20_000
const BASE_HEADERS = { 'x-app-apiclient': 'default', 'x-app-apiversion': '2.18' }
const NON_THREAD_ROOTS = new Set(['discover', 'library', 'spaces', 'settings', 'account', 'finance', 'computer', 'pages', 'collections'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type JsonObject = Record<string, unknown>
type Transport = 'sandbox' | 'page'

const record = (value: unknown): JsonObject | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null

const messageOf = (error: unknown): string => error instanceof Error ? error.message : String(error)

const currentThreadSlug = (): string | null => {
	const segments = location.pathname.split('/').filter(Boolean)
	if (segments.length < 2 || NON_THREAD_ROOTS.has(segments[0]!)) return null

	try {
		return decodeURIComponent(segments.at(-1)!)
	} catch {
		return null
	}
}

const headersFor = (init: RequestInit): Record<string, string> => {
	const account = readCookieAccountId() ?? storage.get<string | null>(ACCOUNT_KEY, null)
	const headers = new Headers(BASE_HEADERS)

	if (account) headers.set('x-pplx-account', account)
	new Headers(init.headers).forEach((value, key) => headers.set(key, value))

	return Object.fromEntries(headers.entries())
}

const fetchWithTimeout = async (transport: Transport, path: string, init: RequestInit): Promise<Response> => {
	const controller = new AbortController()
	let cancel: (() => void) | undefined

	const timeout = new Promise<never>((_resolve, reject) => {
		const timer = window.setTimeout(() => {
			controller.abort()
			reject(new Error(`${transport}: request timed out after ${TIMEOUT / 1000}s`))
		}, TIMEOUT)
		cancel = () => window.clearTimeout(timer)
	})

	const url = `${location.origin}${path}`

	try {
		let request: Promise<Response>

		if (transport === 'page') {
			const page = getPageWindow()
			if (!page?.fetch) throw new Error('Page fetch is unavailable')

			const options: RequestInit = {
				...init,
				credentials: 'include',
				headers: headersFor(init)
			}

			const pageOptions = typeof cloneInto === 'function' ? cloneInto(options, page) : options

			request = page.fetch(url, pageOptions)
		} else {
			request = fetch(url, {
				...init,
				credentials: 'include',
				headers: headersFor(init),
				signal: controller.signal
			})
		}

		return await Promise.race([request, timeout])
	} finally {
		cancel?.()
	}
}

const requestJson = async (path: string, init: RequestInit = {}): Promise<unknown> => {
	const errors: string[] = []
	const transports: Transport[] = getPageWindow()?.fetch ? ['sandbox', 'page'] : ['sandbox']

	for (const transport of transports) {
		try {
			const response = await fetchWithTimeout(transport, path, init)
			const contentType = response.headers.get('content-type') ?? 'unknown'

			if (!response.ok) throw new Error(`HTTP ${response.status}; content-type ${contentType}`)

			const raw = await response.text()
			if (!raw.trim()) throw new Error('Empty response')

			try {
				return JSON.parse(raw) as unknown
			} catch {
				throw new Error(`Expected JSON; content-type ${contentType}`)
			}
		} catch (error) {
			errors.push(`${transport}: ${messageOf(error)}`)
		}
	}

	throw new Error(`${init.method ?? 'GET'} ${path}: ${errors.join(' | ')}`)
}

const findThreadId = (value: unknown): string | null => {
	const visited = new WeakSet<object>()
	const queue: { value: unknown; depth: number }[] = [{ value, depth: 0 }]
	let cursor = 0

	while (cursor < queue.length && cursor < 5_000) {
		const entry = queue[cursor++]!
		if (!entry.value || typeof entry.value !== 'object' || entry.depth > 6) continue
		if (visited.has(entry.value)) continue
		visited.add(entry.value)

		const object = record(entry.value)
		if (object) {
			for (const key of ['thread_uuid', 'uuid']) {
				const candidate = object[key]
				if (typeof candidate === 'string' && UUID.test(candidate)) return candidate
			}
		}

		for (const nested of Object.values(entry.value)) {
			if (nested && typeof nested === 'object') {
				queue.push({ value: nested, depth: entry.depth + 1 })
			}
		}
	}

	return null
}

const fetchThread = async (slug: string): Promise<unknown> => requestJson(`/rest/thread/${encodeURIComponent(slug)}`)

const postMarkdown = async (id: string, filename: string): Promise<string> => {
	const data = record(await requestJson('/rest/thread/export', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			thread_uuid: id,
			format: 'md',
			filename
		})
	}))

	const encoded = data?.['file_content_64']
	if (typeof encoded !== 'string' || !encoded.trim()) throw new Error('The export endpoint did not return file_content_64')

	let binary: string
	try {
		binary = atob(encoded)
	} catch {
		throw new Error('The export endpoint returned invalid base64')
	}

	const markdown = new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))

	if (!markdown.trim()) throw new Error('The exported Markdown was empty')
	return markdown
}

const markdown = async (): Promise<string> => {
	const slug = currentThreadSlug()
	if (!slug) throw new Error('Open a conversation before exporting.')

	const filename = slug.replace(/[^\w-]+/g, '-').slice(0, 80) || 'perplexity-thread'
	let firstError: unknown

	try {
		return await postMarkdown(slug, filename)
	} catch (error) {
		firstError = error
	}

	let thread: unknown
	try {
		thread = await fetchThread(slug)
	} catch (error) {
		throw new Error(`Export failed: ${messageOf(firstError)}. Thread lookup also failed: ${messageOf(error)}`)
	}

	const id = findThreadId(thread)
	if (!id || id === slug) throw new Error(`Export failed: ${messageOf(firstError)}. Thread lookup did not provide a different thread UUID.`)

	return postMarkdown(id, filename)
}

export const exportSource: ExportSource = {
	name: 'Perplexity',
	citations: true,
	slug: currentThreadSlug,
	markdown,
	json: async () => {
		const slug = currentThreadSlug()
		if (!slug) throw new Error('Open a conversation before exporting.')
		return JSON.stringify(await fetchThread(slug), null, 2)
	},
	place: (button) => {
		const indicator = document.querySelector<HTMLElement>('.bp-usage-indicator')
		if (!indicator) return false
		const gear = indicator.querySelector('.bp-gear')
		if (button.parentElement !== indicator || (gear && button.nextElementSibling !== gear)) indicator.insertBefore(button, gear)
		return true
	}
}
