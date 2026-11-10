export interface ExportSource {
  readonly name: string
  readonly citations: boolean
  readonly slug: () => string | null
  readonly markdown: () => Promise<string>
  readonly json: () => Promise<string>
  readonly place: (button: HTMLElement) => boolean
}
