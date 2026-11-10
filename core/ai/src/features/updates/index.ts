import { Feature, Updater } from '@nolly/core'
import type { MenuEntry } from '@nolly/core'
import { logger, platform, storage } from '../../platform'
import { showToast } from '../../ui/toast'

const releaseUrl = (version: string): string => {
	const { releasesUrl, slug } = platform().release
	return `${releasesUrl}/tag/${slug}-v${version}`
}

export class UpdatesFeature extends Feature {
	readonly id = 'updates'
	readonly name = 'Update Checker'
	readonly description = 'Checks for new versions on load and every few minutes, and tells you once per version.'

	private dismissToast: (() => void) | null = null

	private readonly updater = new Updater({
		metaUrl: platform().release.metaUrl,
		current: platform().release.version,
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
		if (pending) entries.push({ id: 'install', label: `Update to v${pending}`, action: () => window.open(platform().release.installUrl, '_blank') })
		if (available && available === this.updater.skipped) {
			entries.push({
				id: 'unskip',
				label: `Show Update v${available} Again`,
				action: () => {
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
		if (result === 'current') showToast(`You are up to date (v${platform().release.version}).`)
		else if (result === 'failed') showToast('Could not check for updates. Try again later.')
	}

	private announce(version: string, current: string): void {
		this.closeToast()
		const { name, installUrl } = platform().release
		this.dismissToast = showToast(`${name} v${version} is available (you have v${current}).`, [
			{ label: 'Update', primary: true, onClick: () => window.open(installUrl, '_blank') },
			{ label: 'What’s new', keepOpen: true, onClick: () => window.open(releaseUrl(version), '_blank') },
			{ label: 'Skip this version', onClick: () => this.updater.skip(version) }
		], 0)
	}

	private closeToast(): void {
		this.dismissToast?.()
		this.dismissToast = null
	}
}
