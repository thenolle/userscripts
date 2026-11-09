export type NotifyPermission = NotificationPermission | 'unsupported'

export interface NotifyOptions {
	readonly body?: string
	readonly tag?: string
	readonly icon?: string
	readonly silent?: boolean
	readonly onClick?: () => void
}

export const notifyPermission = (): NotifyPermission => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

export const requestNotifyPermission = async (): Promise<NotifyPermission> => {
	if (typeof Notification === 'undefined') return 'unsupported'
	if (Notification.permission !== 'default') return Notification.permission
	try {
		return await Notification.requestPermission()
	} catch {
		return Notification.permission
	}
}

export const notify = (title: string, { body, tag, icon, silent, onClick }: NotifyOptions = {}): boolean => {
	if (notifyPermission() !== 'granted') return false
	try {
		const note = new Notification(title, { ...(body ? { body } : {}), ...(tag ? { tag } : {}), ...(icon ? { icon } : {}), ...(silent !== undefined ? { silent } : {}) })
		if (onClick) {
			note.onclick = () => {
				window.focus()
				onClick()
				note.close()
			}
		}
		return true
	} catch {
		return false
	}
}
