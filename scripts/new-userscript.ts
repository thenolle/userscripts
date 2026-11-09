import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const [slug, name] = process.argv.slice(2)
if (!slug || !name || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: bun scripts/new-userscript.ts <kebab-slug> "<Display Name>"')
  process.exit(1)
}
if (existsSync(slug)) {
  console.error(`${slug}/ already exists.`)
  process.exit(1)
}

const files: Record<string, string> = {
  'package.json': JSON.stringify({
    name: slug,
    version: '0.1.0',
    private: true,
    type: 'module',
    license: 'PolyForm-Strict-1.0.0',
    repository: { type: 'git', url: 'git+https://github.com/thenolle/userscripts.git', directory: slug },
    scripts: { build: 'bun run scripts/build.ts', dev: 'bun run scripts/build.ts --watch', typecheck: 'tsc --noEmit' },
    dependencies: { '@nolly/core': 'workspace:*' },
    devDependencies: { '@types/bun': '^1.4.4', typescript: '^7.0.2' }
  }, null, 2),
  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      lib: ['ESNext', 'DOM', 'DOM.Iterable'], types: ['bun'], module: 'preserve', target: 'esnext', moduleResolution: 'bundler',
      verbatimModuleSyntax: true, isolatedModules: true, noEmit: true, strict: true, noImplicitOverride: true, skipLibCheck: true,
      noUnusedLocals: true, noUnusedParameters: true, noPropertyAccessFromIndexSignature: true
    },
    include: ['src', 'scripts', '../core/src/globals.d.ts']
  }, null, 2),
  'README.md': `# ${name}\n\nDescribe what ${name} does in one paragraph.\n\n## Install\n\nInstall from the project website once the first release is published.\n`,
  'CHANGELOG.md': `# Changelog\n\n## 0.1.0\n\n- Initial release.\n`,
  'docs/getting-started.md': `---\ntitle: Getting started\ndescription: Install ${name} and get going.\nsection: Guides\norder: 10\n---\n\n# Getting started\n\nWrite your guide here.\n`,
  'src/types/globals.d.ts': 'declare const __VERSION__: string\n',
  'src/repo.ts': `import { repoUrls } from '@nolly/core'\n\nexport const SLUG = '${slug}'\n\nexport const URLS = repoUrls({ owner: 'thenolle', repo: 'userscripts', branch: 'master', slug: SLUG })\n`,
  'src/main.ts': `import { Userscript } from '@nolly/core'\nimport { Hello } from './features/hello'\n\nnew Userscript({ id: '${slug}', name: '${name}', version: __VERSION__ })\n  .register((context) => new Hello(context))\n  .start()\n`,
  'src/features/hello.ts': `import { Feature } from '@nolly/core'\n\nexport class Hello extends Feature {\n  readonly id = 'hello'\n  readonly name = 'Hello'\n  readonly description = 'Example feature.'\n\n  override onEnable(): void {\n    this.context.logger.info('Hello enabled.')\n  }\n\n  run(): void {}\n}\n`,
  'scripts/header.ts': `import { createHeader as render } from '@nolly/core/build'\nimport { URLS } from '../src/repo'\n\nexport const createHeader = ({ version }: { version: string }): string =>\n  render({\n    name: '${name}',\n    namespace: URLS.namespace,\n    version,\n    description: 'Describe ${name}.',\n    author: 'Nolly',\n    license: 'PolyForm-Strict-1.0.0',\n    homepageURL: URLS.home,\n    supportURL: URLS.issues,\n    updateURL: URLS.meta,\n    downloadURL: URLS.install,\n    icon: 'https://www.google.com/s2/favicons?sz=64&domain=example.com',\n    match: ['https://example.com/*'],\n    noframes: true,\n    grant: ['GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_registerMenuCommand', 'GM_unregisterMenuCommand', 'GM_xmlhttpRequest', 'unsafeWindow']\n  })\n`,
  'scripts/build.ts': `import { buildUserscript } from '@nolly/core/build'\nimport pkg from '../package.json' with { type: 'json' }\nimport { SLUG } from '../src/repo'\nimport { createHeader } from './header'\n\nawait buildUserscript({ slug: SLUG, version: pkg.version, header: createHeader({ version: pkg.version }) })\n`
}

for (const [path, content] of Object.entries(files)) {
  const target = join(slug, path)
  await mkdir(join(target, '..'), { recursive: true })
  await writeFile(target, content.endsWith('\n') ? content : `${content}\n`)
}

const rootFile = JSON.parse(await readFile('package.json', 'utf8')) as { workspaces: string[] }
if (!rootFile.workspaces.includes(slug)) {
  rootFile.workspaces.push(slug)
  await writeFile('package.json', `${JSON.stringify(rootFile, null, 2)}\n`)
}

console.log(`Created ${slug}/. Run: bun install && cd ${slug} && bun run dev`)
