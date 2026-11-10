import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, 'ai/perplexity/src/modules')
const SRC = resolve(ROOT, 'core/ai/src')
const FEATURES = join(SRC, 'features')
const PLATFORM_NAMES = new Set(['storage', 'logger', 'composer', 'generation', 'dispatch'])
const IMPORT = /\b(import|export)\s+(type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'/g
const EXPORT_DECL = /^export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|function|class|interface|type|enum)\s+(\w+)/gm
const EXPORT_DESTRUCTURE = /^export\s+const\s+\{([^}]*)\}\s*=/gm
const EXPORT_LIST = /^export\s+(?:type\s+)?\{([^}]*)\}/gm

const modules = process.argv.slice(2)
if (!modules.length) {
  console.error('Usage: bun scripts/hoist-module.mjs <module-folder> [...]')
  process.exit(1)
}

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]))
const posix = (path) => path.split(sep).join('/')
const names = (list) => list.split(',').map((name) => name.trim()).filter(Boolean)
const bare = (name) => name.replace(/^type\s+/, '')

const move = (from, to) => {
  mkdirSync(dirname(to), { recursive: true })
  try {
    execFileSync('git', ['mv', from, to], { stdio: 'pipe' })
  } catch {
    renameSync(from, to)
  }
}

const scanExports = () => {
  const map = new Map()
  for (const file of walk(SRC).filter((entry) => entry.endsWith('.ts') && !entry.endsWith(`${sep}index.ts`))) {
    const source = readFileSync(file, 'utf8')
    const found = [
      ...[...source.matchAll(EXPORT_DECL)].map((match) => match[1]),
      ...[...source.matchAll(EXPORT_DESTRUCTURE)].flatMap((match) => names(match[1]).map((name) => name.split(':').pop().trim())),
      ...[...source.matchAll(EXPORT_LIST)].flatMap((match) => names(match[1]).map((name) => bare(name).split(/\s+as\s+/).pop()))
    ]
    for (const name of found) if (name && !map.has(name)) map.set(name, file)
  }
  return map
}

const specifierTo = (fromFile, toFile) => {
  const path = posix(relative(dirname(fromFile), toFile)).replace(/\.ts$/, '').replace(/\/index$/, '')
  return path.startsWith('.') ? path : `./${path}`
}

const issues = []
const exportMap = scanExports()

const rewriteImports = (source, file) =>
  source.replace(IMPORT, (match, keyword, typeOnly, list, spec) => {
    const core = /^\.\.\/\.\.\/core\/([\w-]+)$/.exec(spec)?.[1]
    if (core && PLATFORM_NAMES.has(core)) return `${keyword}${typeOnly ? ' type' : ''} {${list}} from '${specifierTo(file, join(SRC, 'platform.ts'))}'`
    if (core === 'dom') return `${keyword}${typeOnly ? ' type' : ''} {${list}} from '${specifierTo(file, join(SRC, 'ui/config.ts'))}'`
    if (spec !== '@nolly/ai') return match
    const groups = new Map()
    for (const entry of names(list)) {
      const target = exportMap.get(bare(entry))
      if (!target) {
        issues.push(`${relative(ROOT, file)}: '${bare(entry)}' is not exported by @nolly/ai`)
        continue
      }
      groups.set(target, [...(groups.get(target) ?? []), entry])
    }
    return [...groups].map(([target, entries]) => `${keyword}${typeOnly ? ' type' : ''} { ${entries.join(', ')} } from '${specifierTo(file, target)}'`).join('\n')
  })

const rewriteLiterals = (source) => {
  let needsConfig = false
  const declared = []
  const lines = source.split('\n').map((entry) => {
    const match = /^(export\s+)?const\s+(\w+)\s*=\s*'better-perplexity([^']*)'[ \t]*(\r?)$/.exec(entry)
    if (!match) return entry
    needsConfig = true
    declared.push(match[2])
    return `${match[1] ?? ''}const ${match[2]} = (): string => \`\${uiConfig().id}${match[3]}\`${match[4]}`
  })
  let text = lines.join('\n')
  for (const name of declared) {
    const declaration = new RegExp(`^(export\\s+)?const\\s+${name}\\s*=\\s*\\(\\)`)
    text = text.split('\n').map((entry) => (declaration.test(entry) ? entry : entry.replace(new RegExp(`\\b${name}\\b`, 'g'), `${name}()`))).join('\n')
  }
  text = text.replace(/'better-perplexity([^']*)'/g, (_match, suffix) => {
    needsConfig = true
    return suffix ? `\`\${uiConfig().id}${suffix}\`` : 'uiConfig().id'
  })
  return { text, needsConfig }
}

const mergeImports = (source) => {
  const groups = new Map()
  const key = (typeOnly, spec) => `${typeOnly ? 'type' : 'value'}|${spec}`
  for (const match of source.matchAll(/^import\s+(type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'\n?/gm)) {
    const id = key(Boolean(match[1]), match[3])
    const group = groups.get(id) ?? { names: [], count: 0 }
    for (const name of names(match[2])) if (!group.names.includes(name)) group.names.push(name)
    group.count++
    groups.set(id, group)
  }
  const seen = new Set()
  return source.replace(/^import\s+(type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'\n?/gm, (match, typeOnly, _list, spec) => {
    const id = key(Boolean(typeOnly), spec)
    const group = groups.get(id)
    if (!group || group.count < 2) return match
    if (seen.has(id)) return ''
    seen.add(id)
    return `import ${typeOnly ? 'type ' : ''}{ ${group.names.join(', ')} } from '${spec}'\n`
  })
}

const addConfigImport = (source, file) => {
  if (/\buiConfig\b[^\n]*from\s+'[^']*ui\/config'/.test(source)) return source
  const line = `import { uiConfig } from '${specifierTo(file, join(SRC, 'ui/config.ts'))}'\n`
  const imports = [...source.matchAll(/^import[^\n]*\n/gm)]
  const last = imports.at(-1)
  if (!last) return line + source
  const end = last.index + last[0].length
  return source.slice(0, end) + line + source.slice(end)
}

const checkResolution = (source, file) => {
  for (const match of source.matchAll(IMPORT)) {
    const spec = match[4]
    if (!spec.startsWith('.')) continue
    const base = resolve(dirname(file), spec)
    if (!existsSync(`${base}.ts`) && !existsSync(join(base, 'index.ts'))) issues.push(`${relative(ROOT, file)}: cannot resolve '${spec}'`)
  }
  source.split('\n').forEach((line, index) => {
    if (/perplexity/i.test(line)) issues.push(`${relative(ROOT, file)}:${index + 1}: still mentions Perplexity: ${line.trim().slice(0, 100)}`)
  })
}

const classRenames = []
for (const name of modules) {
  const from = join(SOURCE, name)
  const to = join(FEATURES, name)
  if (!existsSync(from)) {
    console.error(`Missing ${relative(ROOT, from)}`)
    process.exit(1)
  }
  move(from, to)
  for (const file of walk(to).filter((entry) => entry.endsWith('.ts'))) {
    let source = readFileSync(file, 'utf8')
    source = rewriteImports(source, file)
    const literals = rewriteLiterals(source)
    source = literals.text
    if (literals.needsConfig) source = addConfigImport(source, file)
    source = mergeImports(source)
    if (file === join(to, 'index.ts')) {
      const match = /export class (\w+)Module extends Feature/.exec(source)
      if (match) {
        source = source.replace(new RegExp(`\\b${match[1]}Module\\b`, 'g'), `${match[1]}Feature`)
        classRenames.push({ name, className: `${match[1]}Feature` })
      }
    }
    writeFileSync(file, source)
  }
}

for (const name of modules) for (const file of walk(join(FEATURES, name)).filter((entry) => entry.endsWith('.ts'))) checkResolution(readFileSync(file, 'utf8'), file)

const barrel = join(FEATURES, 'index.ts')
let barrelText = existsSync(barrel) ? readFileSync(barrel, 'utf8') : ''
for (const { name, className } of classRenames) {
  const line = `export { ${className} } from './${name}'\n`
  if (!barrelText.includes(line)) barrelText += line
}
writeFileSync(barrel, barrelText)

console.log(`Hoisted: ${modules.join(', ')}`)
console.log(classRenames.map(({ className }) => `  ${className}`).join('\n'))
if (issues.length) {
  console.log('\nNeeds attention:')
  for (const issue of issues) console.log(`  ${issue}`)
}
