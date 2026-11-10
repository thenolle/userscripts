import { Feature, Updater, type MenuEntry } from '@nolly/core'
import { logger } from '../../core/logger'
import { storage } from '../../core/storage'
import { URLS } from '../../repo'
import { showToast } from '../../ui/toast'

export { isNewerVersion as isNewer } from '@nolly/core'

const releaseUrl = (version: string): string => `${URLS.releases}/tag/better-perplexity-v${version}`

export class UpdatesModule extends Feature {
	readonly id = 'updates'
	readonly name = 'Update Checker'
	readonly description = 'Checks for new versions on load and every few minutes, and tells you once per version.'

	private dismissToast: (() => void) | null = null

	private readonly updater = new Updater({
		metaUrl: URLS.meta,
		current: __VERSION__,
		storage,
		logger,
		namespace: 'updates',
		onAvailable: ({ version, current }) => this.announce(version, current),
		onChange: () => this.context.refreshMenu()
	})

	run(): void { }

	override onEnable(): void {
		this.updater.start(this.scope)
		this.scope.add(() => this.closeToast())
	}

	override menuEntries(): MenuEntry[] {
		const entries: MenuEntry[] = []
		const pending = this.updater.pending
		const available = this.updater.available
		if (pending) entries.push({ id: 'install', label: `Update to v${pending}`, action: () => window.open(URLS.install, '_blank') })
		if (available && available === this.updater.skipped) {
			entries.push({
				id: 'unskip', label: `Show Update v${available} Again`, action: () => {
					this.updater.unskip()
					void this.check(true)
				}
			})
		}
		entries.push({ id: 'check', label: 'Check for Updates', action: () => void this.check(true) })
		return entries
	}

	private async check(manual: boolean): Promise<void> {
		const result = await this.updater.check(manual)
		if (!manual) return
		if (result === 'current') showToast(`You are up to date (v${__VERSION__}).`)
		else if (result === 'failed') showToast('Could not check for updates. Try again later.')
	}

	private announce(version: string, current: string): void {
		this.closeToast()
		this.dismissToast = showToast(`Better Perplexity v${version} is available (you have v${current}).`, [
			{ label: 'Update', primary: true, onClick: () => window.open(URLS.install, '_blank') },
			{ label: 'What’s new', keepOpen: true, onClick: () => window.open(releaseUrl(version), '_blank') },
			{ label: 'Skip this version', onClick: () => this.updater.skip(version) }
		], 0)
	}

	private closeToast(): void {
		this.dismissToast?.()
		this.dismissToast = null
	}
}
