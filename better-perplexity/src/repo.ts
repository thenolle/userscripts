const OWNER = 'thenolle'
const REPO = 'userscripts'
export const SLUG = 'better-perplexity'

const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}`
const SITE = `https://github.com/${OWNER}/${REPO}`

export const URLS = {
  home: `${SITE}/tree/master/${SLUG}`,
  issues: `${SITE}/issues`,
  releases: `${SITE}/releases`,
  sponsor: `https://github.com/sponsors/${OWNER}`,
  meta: `${RAW}/dist/${SLUG}/${SLUG}.meta.js`,
  install: `${RAW}/dist/${SLUG}/${SLUG}.user.js`,
  prompts: `${RAW}/master/${SLUG}/prompts/library.json`
} as const