import { watch } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileNames } from './header'

export interface BuildOptions {
  readonly slug: string
  readonly version: string
  readonly header: string
  readonly entry?: string
  readonly watchDir?: string
}

export const buildUserscript = async ({ slug, version, header, entry = 'src/main.ts', watchDir = 'src' }: BuildOptions): Promise<void> => {
  const isWatch = process.argv.includes('--watch')
  const names = fileNames(slug)
  const build = async (): Promise<void> => {
    const started = performance.now()
    const result = await Bun.build({
      entrypoints: [entry],
      outdir: 'dist',
      naming: names.script,
      target: 'browser',
      format: 'iife',
      minify: !isWatch,
      banner: header,
      define: { __VERSION__: JSON.stringify(version) }
    })
    if (!result.success) {
      for (const log of result.logs) console.error(log)
      if (!isWatch) process.exit(1)
      return
    }
    await mkdir('dist', { recursive: true })
    await writeFile(`dist/${names.meta}`, header)
    const size = ((result.outputs[0]?.size ?? 0) / 1024).toFixed(1)
    console.log(`Built ${names.script} v${version} (${size} KiB${isWatch ? ', unminified' : ', minified'}) in ${(performance.now() - started).toFixed(0)}ms`)
  }
  await build()
  if (isWatch) {
    let timer: ReturnType<typeof setTimeout> | undefined
    watch(watchDir, { recursive: true }, () => {
      clearTimeout(timer)
      timer = setTimeout(() => void build(), 80)
    })
    console.log(`Watching ${watchDir}/ for changes...`)
  }
}
