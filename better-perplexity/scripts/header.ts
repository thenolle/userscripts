import { SLUG, URLS } from '../src/repo'

export interface HeaderOptions {
  version: string
}

type Field = readonly [key: string, value: string]

export const createHeader = ({ version }: HeaderOptions): string => {
  const fields: readonly Field[] = [
    ['name', 'Better Perplexity'],
    ['namespace', 'https://github.com/thenolle/userscripts'],
    ['version', version],
    ['description', 'Layout, code blocks, prompts, batch runs, exports and usage tracking for Perplexity.'],
    ['author', 'Nolly'],
    ['license', 'PolyForm-Strict-1.0.0'],
    ['homepageURL', URLS.home],
    ['supportURL', URLS.issues],
    ['updateURL', URLS.meta],
    ['downloadURL', URLS.install],
    ['icon', 'https://www.google.com/s2/favicons?sz=64&domain=perplexity.ai'],
    ['match', 'https://www.perplexity.ai/*'],
    ['match', 'https://perplexity.ai/*'],
    ['noframes', ''],
    ['connect', 'raw.githubusercontent.com'],
    ['grant', 'GM_getValue'],
    ['grant', 'GM_setValue'],
    ['grant', 'GM_registerMenuCommand'],
    ['grant', 'GM_unregisterMenuCommand'],
    ['grant', 'GM_xmlhttpRequest'],
    ['grant', 'unsafeWindow']
  ]
  const width = Math.max(...fields.map(([key]) => key.length)) + 1
  const lines = fields.map(([key, value]) => `// @${key.padEnd(width)}${value}`.trimEnd())
  return ['// ==UserScript==', ...lines, '// ==/UserScript==', ''].join('\n')
}

export const fileNames = { script: `${SLUG}.user.js`, meta: `${SLUG}.meta.js` } as const