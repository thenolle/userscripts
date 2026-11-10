export const ENDPOINTS = {
	send: '/backend-api/f/conversation',
	init: '/backend-api/conversation/init',
	usage: '/backend-api/wham/usage'
} as const

export const pathOf = (url: string): string => {
	try {
		return new URL(url, location.href).pathname
	} catch {
		return ''
	}
}
