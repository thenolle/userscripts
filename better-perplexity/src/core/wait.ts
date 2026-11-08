export interface WaitOptions {
  timeout?: number
  interval?: number
  signal?: AbortSignal
}

const abortError = (): DOMException => new DOMException('Aborted', 'AbortError')

export const isAbort = (error: unknown): boolean => error instanceof DOMException && error.name === 'AbortError'

export const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const onAbort = (): void => {
      window.clearTimeout(timer)
      reject(abortError())
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })

export const waitFor = async <T>(probe: () => T | null | undefined | false, { timeout = 10_000, interval = 100, signal }: WaitOptions = {}): Promise<T | null> => {
  const deadline = Date.now() + timeout
  for (;;) {
    const value = probe()
    if (value) return value as T
    if (Date.now() >= deadline) return null
    await sleep(interval, signal)
  }
}