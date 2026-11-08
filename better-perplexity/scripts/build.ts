import { mkdir, writeFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import pkg from '../package.json' with { type: 'json' }
import { createHeader, fileNames } from './header'

const isWatch = process.argv.includes('--watch')
const header = createHeader({ version: pkg.version })

const build = async (): Promise<void> => {
  const started = performance.now()
  const result = await Bun.build({
    entrypoints: ['src/main.ts'],
    outdir: 'dist',
    naming: fileNames.script,
    target: 'browser',
    format: 'iife',
    minify: !isWatch,
    banner: header,
    define: { __VERSION__: JSON.stringify(pkg.version) }
  })
  if (!result.success) {
    for (const log of result.logs) console.error(log)
    if (!isWatch) process.exit(1)
    return
  }
  await mkdir('dist', { recursive: true })
  await writeFile(`dist/${fileNames.meta}`, header)
  const size = ((result.outputs[0]?.size ?? 0) / 1024).toFixed(1)
  console.log(`Built ${fileNames.script} v${pkg.version} (${size} KiB${isWatch ? ', unminified' : ', minified'}) in ${(performance.now() - started).toFixed(0)}ms`)
}

await build()

if (isWatch) {
  let timer: ReturnType<typeof setTimeout> | undefined
  watch('src', { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => void build(), 80)
  })
  console.log('Watching src/ for changes...')
}