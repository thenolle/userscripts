/** @jsxImportSource @gambrel/view */
import { mount } from '@gambrel/browser'
import { batch } from '@gambrel/reactivity'
import { App } from './app.tsx'
import { createStore, findPage, findScript, resolveRoute, type Route } from './store.ts'
import type { LoadedPage, Manifest } from './types.ts'

const base = document.querySelector('meta[name="gb:base"]')?.getAttribute('content') ?? '/'
const container = document.getElementById('app')
if (!container) throw new Error('Missing #app container')

const manifest = (await fetch(`${base}content/manifest.json`).then((response) => response.json())) as Manifest
const cache = new Map<string, LoadedPage>()

const load = async (route: Route): Promise<LoadedPage | null> => {
  if (route.kind !== 'page') return null
  const id = `${route.slug}/${route.key}`
  const cached = cache.get(id)
  if (cached) return cached
  const page = (await fetch(`${base}content/${id}.json`).then((response) => response.json())) as LoadedPage
  cache.set(id, page)
  return page
}

const relative = (): string => decodeURIComponent(location.pathname.slice(base.length))
const initialRoute = resolveRoute(manifest, relative())
const theme = document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light'
const store = createStore(manifest, initialRoute, await load(initialRoute), theme)

const setMeta = (selector: string, value: string): void => document.querySelector(selector)?.setAttribute('content', value)

const applyHead = (route: Route): void => {
  const script = route.kind === 'page' ? findScript(manifest, route.slug) : undefined
  const page = route.kind === 'page' ? findPage(script, route.key) : undefined
  const title = page && script ? `${page.kind === 'overview' ? script.name : `${page.title} · ${script.name}`}` : route.kind === 'home' ? manifest.site.title : 'Page not found'
  const description = page?.description ?? manifest.site.title
  document.title = title
  setMeta('meta[name="description"]', description)
  setMeta('meta[property="og:title"]', title)
  setMeta('meta[property="og:description"]', description)
  setMeta('meta[property="og:url"]', location.href)
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', location.href.split('#')[0] ?? location.href)
}

let observer: IntersectionObserver | undefined

const watchHeadings = (): void => {
  observer?.disconnect()
  const links = new Map([...document.querySelectorAll<HTMLAnchorElement>('.toc a')].map((link) => [link.getAttribute('href')?.slice(1) ?? '', link]))
  if (!links.size) return
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      for (const link of links.values()) link.removeAttribute('aria-current')
      links.get(entry.target.id)?.setAttribute('aria-current', 'true')
    }
  }, { rootMargin: '-72px 0px -70% 0px' })
  for (const id of links.keys()) {
    const heading = document.getElementById(id)
    if (heading) observer.observe(heading)
  }
}

const go = async (path: string, push = true): Promise<void> => {
  const [pathname = '', hash = ''] = path.split('#')
  const route = resolveRoute(manifest, pathname)
  store.loading.set(true)
  let page: LoadedPage | null = null
  try {
    page = await load(route)
  } catch {
    location.assign(`${base}${path}`)
    return
  }
  batch(() => {
    store.route.set(route)
    store.page.set(page)
    store.loading.set(false)
    store.navOpen.set(false)
    store.searchOpen.set(false)
  })
  if (push) history.pushState(null, '', `${base}${pathname}${hash ? `#${hash}` : ''}`)
  applyHead(route)
  requestAnimationFrame(() => {
    if (hash) document.getElementById(hash)?.scrollIntoView()
    else window.scrollTo(0, 0)
    watchHeadings()
  })
}

store.go = (path) => void go(path)
store.toggleTheme = () => {
  const next = store.theme() === 'dark' ? 'light' : 'dark'
  store.theme.set(next)
  document.documentElement.dataset['theme'] = next
  document.documentElement.classList.toggle('dark', next === 'dark')
  try {
    localStorage.setItem('theme', next)
  } catch {
    return
  }
}

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const anchor = (event.target as Element).closest('a')
  if (!anchor || anchor.target || anchor.hasAttribute('download')) return
  const url = new URL(anchor.href, location.href)
  if (url.origin !== location.origin || !url.pathname.startsWith(base)) return
  if (url.pathname === location.pathname && url.hash) return
  event.preventDefault()
  void go(`${url.pathname.slice(base.length)}${url.hash}`)
})

window.addEventListener('popstate', () => void go(`${relative()}${location.hash}`, false))
window.addEventListener('keydown', (event) => {
  const typing = (event.target as HTMLElement).closest('input, textarea, [contenteditable]')
  if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !typing)) {
    event.preventDefault()
    store.searchOpen.set(true)
  }
})

mount(container, <App store={store} />)
applyHead(initialRoute)
watchHeadings()