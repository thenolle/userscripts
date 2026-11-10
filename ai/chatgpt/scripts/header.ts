import { createHeader as render, fileNames as namesFor } from '@nolly/core/build'
import { SLUG, URLS } from '../src/repo'

export interface HeaderOptions {
  version: string
}

export const createHeader = ({ version }: HeaderOptions): string =>
  render({
    name: 'Better ChatGPT',
    namespace: 'https://github.com/thenolle/userscripts',
    version,
    description: 'Prompts, batch runs, code blocks, exports and usage tracking for ChatGPT.',
    author: 'Nolly',
    license: 'PolyForm-Strict-1.0.0',
    homepageURL: URLS.home,
    supportURL: URLS.issues,
    updateURL: URLS.meta,
    downloadURL: URLS.install,
    icon: 'https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com',
    match: ['https://chatgpt.com/*', 'https://chat.openai.com/*'],
    noframes: true,
    connect: ['raw.githubusercontent.com'],
    grant: ['GM_getValue', 'GM_setValue', 'GM_registerMenuCommand', 'GM_unregisterMenuCommand', 'GM_xmlhttpRequest', 'unsafeWindow']
  })

export const fileNames = namesFor(SLUG)
