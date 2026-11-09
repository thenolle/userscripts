import { signal } from '@gambrel/reactivity'
import type { LoadedPage, Manifest, PageMeta, ScriptMeta } from './types.ts'

type Sig<T> = ReturnType<typeof signal<T>>

export type Route = { kind: 'home' } | { kind: 'page'; slug: string; key: string } | { kind: 'missing' }

export interface Store {
  manifest: Manifest
  route: Sig<Route>
  page: Sig<LoadedPage | null>
  loading: Sig<boolean>
  theme: Sig<'light' | 'dark'>
  searchOpen: Sig<boolean>
  navOpen: Sig<boolean>
  go: (path: string) => void
  toggleTheme: () => void
}

export const createStore = (manifest: Manifest, route: Route, page: LoadedPage | null, theme: 'light' | 'dark' = 'light'): Store => ({
  manifest,
  route: signal<Route>(route),
  page: signal<LoadedPage | null>(page),
  loading: signal(false),
  theme: signal(theme),
  searchOpen: signal(false),
  navOpen: signal(false),
  go: () => undefined,
  toggleTheme: () => undefined
})

export const resolveRoute = (manifest: Manifest, path: string): Route => {
  const parts = path.split(/[?#]/)[0]!.split('/').filter(Boolean)
  if (!parts.length) return { kind: 'home' }
  const script = manifest.scripts.find((candidate) => candidate.slug === parts[0])
  if (!script || parts.length > 2) return { kind: 'missing' }
  const key = parts[1] ?? 'index'
  return script.pages.some((page) => page.key === key) ? { kind: 'page', slug: script.slug, key } : { kind: 'missing' }
}

export const findScript = (manifest: Manifest, slug: string): ScriptMeta | undefined => manifest.scripts.find((script) => script.slug === slug)

export const findPage = (script: ScriptMeta | undefined, key: string): PageMeta | undefined => script?.pages.find((page) => page.key === key)