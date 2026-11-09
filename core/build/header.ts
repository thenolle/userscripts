export interface UserscriptMeta {
  readonly name: string
  readonly namespace: string
  readonly version: string
  readonly description: string
  readonly author: string
  readonly license: string
  readonly homepageURL: string
  readonly supportURL: string
  readonly updateURL: string
  readonly downloadURL: string
  readonly icon: string
  readonly match: readonly string[]
  readonly connect?: readonly string[]
  readonly grant?: readonly string[]
  readonly runAt?: 'document-start' | 'document-end' | 'document-idle'
  readonly noframes?: boolean
}

type Field = readonly [key: string, value: string]

export const createHeader = (meta: UserscriptMeta): string => {
  const fields: Field[] = [
    ['name', meta.name],
    ['namespace', meta.namespace],
    ['version', meta.version],
    ['description', meta.description],
    ['author', meta.author],
    ['license', meta.license],
    ['homepageURL', meta.homepageURL],
    ['supportURL', meta.supportURL],
    ['updateURL', meta.updateURL],
    ['downloadURL', meta.downloadURL],
    ['icon', meta.icon],
    ...meta.match.map((value): Field => ['match', value]),
    ...(meta.runAt ? [['run-at', meta.runAt] as Field] : []),
    ...(meta.noframes ? [['noframes', ''] as Field] : []),
    ...(meta.connect ?? []).map((value): Field => ['connect', value]),
    ...(meta.grant ?? []).map((value): Field => ['grant', value])
  ]
  const width = Math.max(...fields.map(([key]) => key.length)) + 1
  const lines = fields.map(([key, value]) => `// @${key.padEnd(width)}${value}`.trimEnd())
  return ['// ==UserScript==', ...lines, '// ==/UserScript==', ''].join('\n')
}

export const fileNames = (slug: string) => ({ script: `${slug}.user.js`, meta: `${slug}.meta.js` }) as const
