import type { Manifest, PageMeta, ScriptMeta } from '../src/types.ts'

export interface SeoPage {
  path: string
  title: string
  description: string
  image: string
  kind: 'home' | 'overview' | 'guide' | 'changelog' | 'prompts' | 'missing'
  noindex: boolean
  script?: ScriptMeta
  page?: PageMeta
}

export const esc = (value: string): string => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)

const json = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c')

const crumbs = (site: Manifest['site'], page: SeoPage): unknown[] => {
  const items: [string, string][] = [['Home', site.url]]
  if (page.script) items.push([page.script.name, `${site.url}${page.script.slug}/`])
  if (page.page && page.page.kind !== 'overview') items.push([page.page.title, `${site.url}${page.page.path}`])
  return items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item }))
}

const graph = (site: Manifest['site'], page: SeoPage, url: string): unknown[] => {
  const author = { '@type': 'Person', name: 'Nolly', url: 'https://github.com/thenolle' }
  if (page.kind === 'home') return [{ '@context': 'https://schema.org', '@type': 'WebSite', name: site.title, url: site.url, description: page.description, author }]
  if (!page.script) return []
  const list = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs(site, page) }
  if (page.kind === 'overview') {
    return [
      { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: page.script.name, description: page.script.description, applicationCategory: 'BrowserApplication', operatingSystem: 'Any', softwareVersion: page.script.version, downloadUrl: page.script.installUrl, license: `https://github.com/${site.repo}/blob/${site.branch}/LICENSE`, url, author, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      list
    ]
  }
  return [{ '@context': 'https://schema.org', '@type': 'TechArticle', headline: page.title, description: page.description, url, image: page.image, dateModified: site.generated, author, isPartOf: { '@type': 'SoftwareApplication', name: page.script.name } }, list]
}

/** Title, description, canonical, Open Graph, Twitter and JSON-LD tags for one page. */
export const headTags = (page: SeoPage, site: Manifest['site']): string => {
  const url = `${site.url}${page.path}`
  const image = `${site.url}${page.image}`
  const lines = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    page.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">',
    '<meta name="author" content="Nolly">',
    '<meta name="theme-color" content="#18181b">',
    `<meta property="og:site_name" content="${esc(site.title)}">`,
    `<meta property="og:type" content="${page.kind === 'guide' ? 'article' : 'website'}">`,
    '<meta property="og:locale" content="en_US">',
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(page.title)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(page.title)}">`,
    `<meta name="twitter:description" content="${esc(page.description)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
    ...graph(site, page, url).map((data) => `<script type="application/ld+json">${json(data)}</script>`)
  ]
  return lines.join('\n')
}

export const sitemap = (site: Manifest['site'], paths: readonly string[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${esc(site.url + path)}</loc><lastmod>${site.generated.slice(0, 10)}</lastmod></url>`).join('\n')}\n</urlset>\n`

export const robots = (site: Manifest['site']): string => `User-agent: *\nAllow: /\n\nSitemap: ${site.url}sitemap.xml\n`

export const webManifest = (site: Manifest['site']): string =>
  JSON.stringify({ name: site.title, short_name: 'Userscripts', start_url: site.base, scope: site.base, display: 'standalone', background_color: '#ffffff', theme_color: '#18181b', icons: [{ src: `${site.base}favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] })