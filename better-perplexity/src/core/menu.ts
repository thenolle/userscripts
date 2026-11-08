import type { MenuEntry } from './module'

const supported = typeof GM_registerMenuCommand === 'function' && typeof GM_unregisterMenuCommand === 'function'

export class MenuController {
  private ids: number[] = []

  sync(entries: readonly MenuEntry[]): void {
    if (!supported) return
    for (const id of this.ids) GM_unregisterMenuCommand(id)
    this.ids = entries.map(({ label, action }) => GM_registerMenuCommand(label, action))
  }
}