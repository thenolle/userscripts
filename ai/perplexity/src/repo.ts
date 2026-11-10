import { repoUrls } from '@nolly/core'

export const SLUG = 'better-perplexity'

const urls = repoUrls({ owner: 'thenolle', repo: 'userscripts', branch: 'master', slug: SLUG, dir: 'ai/perplexity' })

export const URLS = {
	home: urls.home,
	issues: urls.issues,
	releases: urls.releases,
	sponsor: urls.sponsor,
	meta: urls.meta,
	install: urls.install,
	prompts: urls.rawFile('prompts/library.json')
} as const
