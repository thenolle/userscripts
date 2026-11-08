const OWNER = 'thenolle'
const REPO = 'userscripts'
const BRANCH = 'master'
export const SLUG = 'better-perplexity'

const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}`
const SITE = `https://github.com/${OWNER}/${REPO}`

export const URLS = {
  home: `${SITE}/tree/${BRANCH}/${SLUG}`,
  issues: `${SITE}/issues`,
  releases: `${SITE}/releases`,
  sponsor: `https://github.com/sponsors/${OWNER}`,
  meta: `${RAW}/dist/${SLUG}/${SLUG}.meta.js`,
  install: `${RAW}/dist/${SLUG}/${SLUG}.user.js`,
  prompts: `${RAW}/${BRANCH}/${SLUG}/prompts/library.json`
} as const
