import { copyFile, cp, mkdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadContent, writeContent } from './content.ts'
import { prerender } from './prerender.ts'

const root = join(import.meta.dir, '..')
const dist = join(root, 'dist')
const source = resolve(root, process.env['SOURCE_DIR'] ?? '../source')
const production = process.env['NODE_ENV'] !== 'development'

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

const bundle = await Bun.build({
  entrypoints: [join(root, 'src', 'client.tsx')],
  outdir: dist,
  naming: 'client.js',
  target: 'browser',
  format: 'esm',
  minify: production,
  sourcemap: production ? 'none' : 'inline',
  define: { 'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development') }
})
if (!bundle.success) throw new Error(bundle.logs.map((log) => log.message).join('\n'))

await cp(join(root, 'public'), dist, { recursive: true })
await copyFile(fileURLToPath(import.meta.resolve('@gambrel/components/styles.css')), join(dist, 'components.css'))

const content = await loadContent(source)
await writeContent(dist, content)
await prerender(dist, content)

const pages = [...content.pages.keys()].length
console.log(`Built ${content.manifest.scripts.length} scripts and ${pages} pages into ${dist}`)