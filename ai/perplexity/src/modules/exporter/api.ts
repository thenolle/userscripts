import { storage } from '../../core/storage'
import { readCookieAccountId } from '../usage-status/account-cookie'

export interface ExportedFile {
  filename: string
  bytes: Uint8Array
}

const NON_THREAD_ROOTS = new Set(['discover', 'library', 'spaces', 'settings', 'account', 'finance', 'computer', 'pages', 'collections'])
const ACCOUNT_KEY = 'usage-status:account-id'
const BASE_HEADERS = { 'x-app-apiclient': 'default', 'x-app-apiversion': '2.18' }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const request = (path: string, init: RequestInit = {}): Promise<Response> => {
  const account = readCookieAccountId() ?? storage.get<string | null>(ACCOUNT_KEY, null)
  const extra = (init.headers ?? {}) as Record<string, string>
  return fetch(`${location.origin}${path}`, {
    credentials: 'include',
    ...init,
    headers: { ...BASE_HEADERS, ...(account ? { 'x-pplx-account': account } : {}), ...extra }
  })
}

export const currentThreadSlug = (): string | null => {
  const segments = location.pathname.split('/').filter(Boolean)
  return segments.length >= 2 && !NON_THREAD_ROOTS.has(segments[0]!) ? (segments.at(-1) ?? null) : null
}

const deepFind = (value: unknown, keys: readonly string[], depth = 0): string | null => {
  if (!value || typeof value !== 'object' || depth > 6) return null
  for (const [key, nested] of Object.entries(value)) {
    if (keys.includes(key) && typeof nested === 'string' && UUID.test(nested)) return nested
  }
  for (const nested of Object.values(value)) {
    const found = deepFind(nested, keys, depth + 1)
    if (found) return found
  }
  return null
}

const postExport = async (id: string, format: string, filename: string): Promise<ExportedFile> => {
  const response = await request('/rest/thread/export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ thread_uuid: id, format, filename }) })
  if (!response.ok) throw new Error(`Export request returned HTTP ${response.status}`)
  const data = (await response.json()) as { file_content_64?: string; filename?: string }
  if (!data.file_content_64) throw new Error('The export response had no file content.')
  return { filename: data.filename ?? `${filename}.${format}`, bytes: Uint8Array.from(atob(data.file_content_64), (char) => char.charCodeAt(0)) }
}

const fetchThread = async (slug: string): Promise<unknown> => {
  const response = await request(`/rest/thread/${encodeURIComponent(slug)}`)
  if (!response.ok) throw new Error(`Thread request returned HTTP ${response.status}`)
  return response.json()
}

export const exportThread = async (format: 'md' | 'docx' | 'pdf', filename: string): Promise<ExportedFile> => {
  const slug = currentThreadSlug()
  if (!slug) throw new Error('Open a thread first.')
  try {
    return await postExport(slug, format, filename)
  } catch (first) {
    const uuid = deepFind(await fetchThread(slug).catch(() => null), ['thread_uuid', 'uuid'])
    if (!uuid || uuid === slug) throw first
    return postExport(uuid, format, filename)
  }
}

export const fetchThreadJson = async (): Promise<string> => {
  const slug = currentThreadSlug()
  if (!slug) throw new Error('Open a thread first.')
  return JSON.stringify(await fetchThread(slug), null, 2)
}