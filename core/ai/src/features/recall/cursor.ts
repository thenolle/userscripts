export class HistoryCursor {
  private index = -1
  private shown: string | null = null

  constructor(private readonly source: () => readonly string[]) {}

  previous(current: string, atStart: boolean): string | null {
    if (current.trim() !== '') {
      if (this.shown === null || current !== this.shown) {
        this.reset()
        return null
      }
      if (current.includes('\n') && !atStart) return null
    }
    const items = this.source()
    const next = this.index + 1
    if (next >= items.length) return null
    this.index = next
    this.shown = items[next]!
    return this.shown
  }

  next(current: string, atEnd: boolean): string | null {
    if (this.shown === null || current !== this.shown) {
      this.reset()
      return null
    }
    if (current.includes('\n') && !atEnd) return null
    if (this.index <= 0) {
      this.reset()
      return ''
    }
    this.index -= 1
    this.shown = this.source()[this.index] ?? ''
    return this.shown
  }

  reset(): void {
    this.index = -1
    this.shown = null
  }
}
