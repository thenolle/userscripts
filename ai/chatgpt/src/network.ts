import { ResponseSpy } from '@nolly/ai'
import { ENDPOINTS, pathOf } from './endpoints'

export const responseSpy = new ResponseSpy(({ url, method }) => {
	const path = pathOf(url)
	if (method === 'POST' && path === ENDPOINTS.send) return 'stream'
	if (path === ENDPOINTS.init || path === ENDPOINTS.usage) return 'body'
	return null
})
