import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseBlocks, parseFrontMatter, plain } from '../src/markdown.ts'
import type { ScriptKind, Heading, LoadedPage, Manifest, PageKind, PageMeta, Prompt, ScriptMeta } from '../src/types.ts'

const REPO = 'thenolle/userscripts'
const BRANCH = 'master'
const DEFAULT_URL = 'https://thenolle.github.io/userscripts/'

export interface Content {
  manifest: Manifest
  pages: Map<string, LoadedPage>
}

export const siteConfig = (): Manifest['site'] => {
  const url = new URL(process.env['SITE_URL'] ?? DEFAULT_URL)
  const base = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  return { title: 'Userscripts by Nolly', url: `${url.origin}${base}`, base, repo: REPO, branch: BRANCH, sponsor: 'https://github.com/sponsors/thenolle', generated: new Date().toISOString() }
}

const headingsOf = (markdown: string): Heading[] => parseBlocks(markdown).flatMap((block) => (block.type === 'heading' ? [{ depth: block.level, id: block.id, text: block.text }] : []))

const firstParagraph = (markdown: string): string => {
  const block = parseBlocks(markdown).find((candidate) => candidate.type === 'paragraph')
  const text = block?.type === 'paragraph' ? plain(block.inlines) : ''
  return text.length > 200 ? `${text.slice(0, 197).trimEnd()}…` : text
}

const firstTitle = (markdown: string): string => {
  const block = parseBlocks(markdown).find((candidate) => candidate.type === 'heading' && candidate.level === 1)
  return block?.type === 'heading' ? block.text : ''
}

const minutesOf = (markdown: string): number => Math.max(1, Math.round(markdown.split(/\s+/).length / 220))

const readOptional = async (path: string): Promise<string | null> => (existsSync(path) ? readFile(path, 'utf8') : null)

const loadScript = async (sourceDir: string, slug: string, site: Manifest['site']): Promise<{ script: ScriptMeta; pages: Map<string, LoadedPage> } | null> => {
  const root = join(sourceDir, slug)
  const pkg = JSON.parse((await readOptional(join(root, 'package.json'))) ?? 'null') as { version?: string; license?: string; userscript?: { kind?: ScriptKind } } | null
  const kind: ScriptKind = pkg?.userscript?.kind === 'library' ? 'library' : 'script'
  const readme = await readOptional(join(root, 'README.md'))
  if (!pkg?.version || readme === null) return null
  const pages = new Map<string, LoadedPage>()
  const metas: PageMeta[] = []
  const add = (key: string, kind: PageKind, markdown: string, meta: { title: string; description: string; section: string; order: number; source: string }, prompts?: Prompt[]): void => {
    pages.set(`${slug}/${key}`, { markdown, ...(prompts ? { prompts } : {}) })
    metas.push({ slug, key, kind, ...meta, path: key === 'index' ? `${slug}/` : `${slug}/${key}/`, headings: headingsOf(markdown), minutes: minutesOf(markdown) })
  }

  const front = parseFrontMatter(readme)
  const name = front.data['title'] ?? (firstTitle(front.body) || slug)
  const description = front.data['description'] ?? firstParagraph(front.body)
  add('index', 'overview', front.body, { title: name, description, section: 'Overview', order: 0, source: `${slug}/README.md` })

  const docsDir = join(root, 'docs')
  if (existsSync(docsDir)) {
    for (const file of (await readdir(docsDir)).filter((entry) => entry.endsWith('.md')).sort()) {
      const key = file.replace(/\.md$/, '')
      const doc = parseFrontMatter(await readFile(join(docsDir, file), 'utf8'))
      add(key, 'guide', doc.body, {
        title: doc.data['title'] ?? (firstTitle(doc.body) || key),
        description: doc.data['description'] ?? firstParagraph(doc.body),
        section: doc.data['section'] ?? 'Guides',
        order: Number(doc.data['order'] ?? 100),
        source: `${slug}/docs/${file}`
      })
    }
  }

  const changelog = await readOptional(join(root, 'CHANGELOG.md'))
  if (changelog !== null) add('changelog', 'changelog', changelog, { title: 'Changelog', description: `Release notes for ${name}.`, section: 'Reference', order: 900, source: `${slug}/CHANGELOG.md` })

  const library = await readOptional(join(root, 'prompts', 'library.json'))
  if (library !== null) {
    const prompts = (JSON.parse(library) as { prompts?: Prompt[] }).prompts ?? []
    const intro = `Prompts shared by the community. ${name} loads this list from GitHub, caches it for 24 hours, and shows it in the prompt picker. Press Save in the picker to copy one into your own library, or copy the text here.\n\n## Suggest a prompt\n\nUse the [prompt submission form](https://github.com/${site.repo}/issues/new?template=prompt_submission.yml) or open a pull request that edits \`${slug}/prompts/library.json\`.`
    add('prompts', 'prompts', intro, { title: 'Community prompts', description: `${prompts.length} ready-made prompts for ${name}, with placeholders you fill in.`, section: 'Reference', order: 910, source: `${slug}/prompts/library.json` }, prompts)
  }

  metas.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  const raw = `https://raw.githubusercontent.com/${site.repo}/dist/${slug}`
  return {
  script: {
    slug,
    kind,
    name,
    version: pkg.version,
    description,
    license: pkg.license ?? 'See LICENSE',
    installUrl: kind === 'library' ? '' : `${raw}/${slug}.user.js`,
    metaUrl: kind === 'library' ? '' : `${raw}/${slug}.meta.js`,
    folderUrl: `https://github.com/${site.repo}/tree/${site.branch}/${slug}`,
    pages: metas
  },
  pages
}
}

export const loadContent = async (sourceDir: string): Promise<Content> => {
  const site = siteConfig()
  const scripts: ScriptMeta[] = []
  const pages = new Map<string, LoadedPage>()
  for (const entry of (await readdir(sourceDir, { withFileTypes: true })).filter((item) => item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules')) {
    const loaded = await loadScript(sourceDir, entry.name, site)
    if (!loaded) continue
    scripts.push(loaded.script)
    for (const [key, page] of loaded.pages) pages.set(key, page)
  }
  if (!scripts.length) throw new Error(`No userscript folders found in ${sourceDir}`)
  scripts.sort((a, b) => a.name.localeCompare(b.name))
  return { manifest: { site, scripts }, pages }
}

export const writeContent = async (dist: string, { manifest, pages }: Content): Promise<void> => {
  await mkdir(join(dist, 'content'), { recursive: true })
  await writeFile(join(dist, 'content', 'manifest.json'), JSON.stringify(manifest))
  for (const [key, page] of pages) {
    const file = join(dist, 'content', `${key}.json`)
    await mkdir(join(file, '..'), { recursive: true })
    await writeFile(file, JSON.stringify(page))
  }
}