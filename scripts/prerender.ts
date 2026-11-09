import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createElement, renderToString } from '@gambrel/view'
import { App } from '../src/app.tsx'
import { createStore, resolveRoute } from '../src/store.ts'
import type { Manifest } from '../src/types.ts'
import type { Content } from './content.ts'
import { ogCard } from './og.ts'
import { headTags, robots, sitemap, webManifest, type SeoPage } from './seo.ts'

const shell = (head: string, body: string, site: Manifest['site']): string => `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="gb:base" content="${site.base}">
<script>try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}</script>
${head}
<link rel="icon" href="${site.base}favicon.svg" type="image/svg+xml">
<link rel="manifest" href="${site.base}site.webmanifest">
<link rel="stylesheet" href="${site.base}components.css">
<link rel="stylesheet" href="${site.base}site.css">
</head>
<body>
<div id="app">${body}</div>
<noscript><p style="padding:1rem">This documentation needs JavaScript. The source Markdown is on <a href="https://github.com/${site.repo}">GitHub</a>.</p></noscript>
<script type="module" src="${site.base}client.js"></script>
</body>
</html>
`

export const prerender = async (dist: string, content: Content): Promise<void> => {
  const { manifest } = content
  const { site } = manifest
  const paths: string[] = []
  const write = async (path: string, seo: SeoPage, chips: string[], label: string): Promise<void> => {
    const card = ogCard({ label, title: seo.title.split(' · ')[0] ?? seo.title, description: seo.description, chips, seed: seo.path || 'home' })
    const name = seo.noindex ? 'not-found' : (seo.path.replace(/\/$/, '').replace(/[^a-z0-9-]+/gi, '-') || 'home')
    await mkdir(join(dist, 'og'), { recursive: true })
    await writeFile(join(dist, 'og', `${name}.png`), card)
    const image = `og/${name}.png?v=${createHash('sha256').update(card).digest('hex').slice(0, 12)}`
    const route = resolveRoute(manifest, path)
    const store = createStore(manifest, route, route.kind === 'page' ? (content.pages.get(`${route.slug}/${route.key}`) ?? null) : null)
    const html = await renderToString(createElement(App, { store }))
    const file = join(dist, seo.noindex ? '404.html' : path === '' ? 'index.html' : join(path, 'index.html'))
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, shell(headTags({ ...seo, image }, site), html, site), 'utf8')
    if (!seo.noindex) paths.push(path)
  }

  const guides = manifest.scripts.reduce((sum, script) => sum + script.pages.filter((page) => page.kind === 'guide').length, 0)
  await write('', { path: '', title: site.title, description: 'Guides, release notes and automatic updates for small, focused browser userscripts by Nolly.', image: '', kind: 'home', noindex: false }, [`${manifest.scripts.length} scripts`, `${guides} guides`, 'PolyForm Strict'], 'Documentation')
  for (const script of manifest.scripts) {
    for (const page of script.pages) {
      const overview = page.kind === 'overview'
      await write(
        page.path,
        { path: page.path, title: overview ? script.name : `${page.title} · ${script.name}`, description: page.description, image: '', kind: page.kind, noindex: false, script, page },
        [`v${script.version}`, script.license, `${page.minutes} min read`],
        overview ? 'Userscript' : `${script.name} · ${page.section}`
      )
    }
  }
  await write('404.html', { path: '404.html', title: 'Page not found', description: 'That page does not exist, or it moved.', image: '', kind: 'missing', noindex: true }, ['404'], 'Documentation')
  await writeFile(join(dist, 'sitemap.xml'), sitemap(site, paths), 'utf8')
  await writeFile(join(dist, 'robots.txt'), robots(site), 'utf8')
  await writeFile(join(dist, 'site.webmanifest'), webManifest(site), 'utf8')
  await writeFile(join(dist, '.nojekyll'), '', 'utf8')
}