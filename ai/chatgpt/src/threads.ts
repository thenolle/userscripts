const THREAD_PATH = /^\/(?:g\/[^/]+\/)?c\/[^/]+/

export const threadOf = (pathname: string): string | null => (THREAD_PATH.test(pathname) ? pathname : null)
