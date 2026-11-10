import { createLogger, sleep, waitFor } from '@nolly/core'
import type { ComposerAdapter } from './adapter'

const STOP_SELECTOR = 'button[aria-label*="stop" i], button[title*="stop" i], [data-testid*="stop" i]'
const logger = createLogger('ai')

export interface ResponseWaitOptions {
	startTimeout?: number
	settle?: number
	timeout?: number
	signal?: AbortSignal
}

export interface GenerationOptions {
	readonly adapter: ComposerAdapter
	readonly isStreaming?: () => boolean
}

export interface GenerationKit {
	isGenerating(): boolean
	waitForResponse(options?: ResponseWaitOptions): Promise<boolean>
}

export const createGenerationKit = ({ adapter, isStreaming }: GenerationOptions): GenerationKit => {
	const stopVisible = (): boolean => adapter.findStopButton ? adapter.findStopButton() !== null : [...document.querySelectorAll(STOP_SELECTOR)].some((element) => !adapter.isOwnUi(element))

	const isGenerating = (): boolean => stopVisible() || (isStreaming?.() ?? false)

	const waitForResponse = async ({ startTimeout = 15_000, settle = 1_500, timeout = 300_000, signal }: ResponseWaitOptions = {}): Promise<boolean> => {
		await waitFor(() => isGenerating() || null, { timeout: startTimeout, interval: 150, signal })
		const deadline = Date.now() + timeout
		let idleSince = 0
		while (Date.now() < deadline) {
			if (isGenerating()) {
				idleSince = 0
			} else {
				idleSince ||= Date.now()
				if (Date.now() - idleSince >= settle) return true
			}
			await sleep(250, signal)
		}
		logger.warning('Timed out waiting for the answer to finish.')
		return false
	}

	return { isGenerating, waitForResponse }
}
