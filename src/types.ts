export interface Prompt {
  id: string
  title: string
  body: string
}

export interface Heading {
  depth: number
  id: string
  text: string
}

export type PageKind = 'overview' | 'guide' | 'changelog' | 'prompts'

export interface PageMeta {
  slug: string
  key: string
  kind: PageKind
  title: string
  description: string
  section: string
  order: number
  path: string
  source: string
  headings: Heading[]
  minutes: number
}

export interface ScriptMeta {
  slug: string
  name: string
  version: string
  description: string
  license: string
  installUrl: string
  metaUrl: string
  folderUrl: string
  pages: PageMeta[]
}

export interface Manifest {
  site: { title: string; url: string; base: string; repo: string; branch: string; sponsor: string; generated: string }
  scripts: ScriptMeta[]
}

export interface LoadedPage {
  markdown: string
  prompts?: Prompt[]
}