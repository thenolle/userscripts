import { isAbort, sleep } from './wait'

export interface RetryOptions {
	readonly attempts?: number
	readonly delay?: number
	readonly factor?: number
	readonly maxDelay?: number
	readonly signal?: AbortSignal
	readonly shouldRetry?: (error: unknown, attempt: number) => boolean
}

export const retry = async <T>(task: (attempt: number) => Promise<T>, { attempts = 3, delay = 500, factor = 2, maxDelay = 30_000, signal, shouldRetry }: RetryOptions = {}): Promise<T> => {
	let wait = delay
	for (let attempt = 1; ; attempt++) {
		try {
			return await task(attempt)
		} catch (error) {
			if (attempt >= attempts || isAbort(error) || shouldRetry?.(error, attempt) === false) throw error
			await sleep(wait, signal)
			wait = Math.min(maxDelay, wait * factor)
		}
	}
}

export const withTimeout = <T>(promise: Promise<T>, ms: number, message = 'Timed out'): Promise<T> => new Promise<T>((resolve, reject) => {
	const timer = setTimeout(() => reject(new Error(message)), ms)
	promise.then((value) => {
		clearTimeout(timer)
		resolve(value)
	}, (error: unknown) => {
		clearTimeout(timer)
		reject(error)
	})
})
