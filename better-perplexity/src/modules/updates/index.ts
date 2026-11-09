import { Feature, getText, type MenuEntry } from '@nolly/core'
import { logger } from '../../core/logger'
import { storage } from '../../core/storage'
import { URLS } from '../../repo'
import { showToast } from '../../ui/toast'

const LAST_CHECK = 'updates:last-check'
const DISMISSED = 'updates:dismissed'
const INTERVAL = 12 * 3_600_000
const RECHECK_EVERY = 3_600_000
const STARTUP_DELAY = 6_000

const versionParts = (version: string): number[] => version.split('.').map((part) => Number.parseInt(part, 10) || 0)

export const isNewer = (candidate: string, current: string): boolean => {
  const a = versionParts(candidate)
  const b = versionParts(current)
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0)
    if (difference !== 0) return difference > 0
  }
  return false
}

export class UpdatesModule extends Feature {
  readonly id = 'updates'
  readonly name = 'Update Checker'
  readonly description = 'Checks GitHub for new versions of this userscript.'

  run(): void {}

  override onEnable(): void {
    this.scope.timeout(() => void this.checkIfDue(), STARTUP_DELAY)
    this.scope.interval(() => void this.checkIfDue(), RECHECK_EVERY)
  }

  override menuEntries(): MenuEntry[] {
    return [{ id: 'check', label: 'Check for Updates', action: () => void this.check(true) }]
  }

  private async checkIfDue(): Promise<void> {
    if (Date.now() - storage.get(LAST_CHECK, 0) >= INTERVAL) await this.check(false)
  }

  private async check(manual: boolean): Promise<void> {
    try {
      const meta = await getText(`${URLS.meta}?t=${Date.now()}`)
      storage.set(LAST_CHECK, Date.now())
      const latest = /@version\s+(\S+)/.exec(meta)?.[1]
      if (!latest) throw new Error('No version found in the published metadata.')
      if (!isNewer(latest, __VERSION__)) {
        if (manual) showToast(`You are up to date (v${__VERSION__}).`)
        return
      }
      if (!manual && storage.get<string | null>(DISMISSED, null) === latest) return
      showToast(`Better Perplexity v${latest} is available (you have v${__VERSION__}).`, [
        { label: 'Update', primary: true, onClick: () => window.open(URLS.install, '_blank') },
        { label: 'What’s new', onClick: () => window.open(URLS.releases, '_blank') },
        { label: 'Later', onClick: () => storage.set(DISMISSED, latest) }
      ], 0)
    } catch (error) {
      logger.warning('Update check failed.', error)
      if (manual) showToast('Could not check for updates. Try again later.')
    }
  }
}
