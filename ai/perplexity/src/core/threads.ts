const ROOT_PATH = /^\/(?:computer|spaces|library|discover)?\/?$/

export const threadOf = (pathname: string): string | null => (ROOT_PATH.test(pathname) ? null : pathname)
