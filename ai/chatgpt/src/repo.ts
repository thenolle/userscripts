import { repoUrls } from '@nolly/core'

export const SLUG = 'better-chatgpt'

const urls = repoUrls({ owner: 'thenolle', repo: 'userscripts', branch: 'master', slug: SLUG, dir: 'ai/chatgpt' })
const sharedPrompts = repoUrls({ owner: 'thenolle', repo: 'userscripts', branch: 'master', slug: 'better-perplexity', dir: 'ai/perplexity' })

export const URLS = {
  home: urls.home,
  issues: urls.issues,
  releases: urls.releases,
  sponsor: urls.sponsor,
  meta: urls.meta,
  install: urls.install,
  prompts: sharedPrompts.rawFile('prompts/library.json')
} as const
