export interface RepoOptions {
  readonly owner: string
  readonly repo: string
  readonly branch: string
  readonly slug: string
}

export const repoUrls = ({ owner, repo, branch, slug }: RepoOptions) => {
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}`
  const site = `https://github.com/${owner}/${repo}`
  return {
    home: `${site}/tree/${branch}/${slug}`,
    namespace: site,
    issues: `${site}/issues`,
    releases: `${site}/releases`,
    sponsor: `https://github.com/sponsors/${owner}`,
    meta: `${raw}/dist/${slug}/${slug}.meta.js`,
    install: `${raw}/dist/${slug}/${slug}.user.js`,
    rawFile: (path: string): string => `${raw}/${branch}/${slug}/${path}`
  } as const
}
