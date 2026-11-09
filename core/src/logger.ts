const WIDTH = 42

const STYLES = {
  banner: 'color: #c4b5fd; font-weight: bold; font-size: 13px; line-height: 1.5',
  success: 'color: #86efac; font-weight: bold',
  info: 'color: #93c5fd',
  warning: 'color: #fcd34d; font-weight: bold',
  error: 'color: #fca5a5; font-weight: bold',
  muted: 'color: #a1a1aa'
} as const

export interface Logger {
  banner(version: string): void
  success(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warning(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
  debug(message: string, ...args: unknown[]): void
  errorOnce(label: string, error: unknown): void
}

const center = (text: string): string => {
  const left = Math.max(0, Math.floor((WIDTH - text.length) / 2))
  return `│${' '.repeat(left)}${text}${' '.repeat(Math.max(0, WIDTH - text.length - left))}│`
}

export const createLogger = (name: string): Logger => {
  const prefix = `[${name}]`
  const reported = new Set<string>()
  const logger: Logger = {
    banner(version) {
      const blank = center('')
      const lines = [`╭${'─'.repeat(WIDTH)}╮`, blank, center(name.toUpperCase()), blank, center(`v${version}`), blank, `╰${'─'.repeat(WIDTH)}╯`]
      console.log(`%c${lines.join('\n')}`, STYLES.banner)
    },
    success: (message, ...args) => console.log(`%c${prefix} ✔ ${message}`, STYLES.success, ...args),
    info: (message, ...args) => console.info(`%c${prefix} ℹ ${message}`, STYLES.info, ...args),
    warning: (message, ...args) => console.warn(`%c${prefix} ⚠ ${message}`, STYLES.warning, ...args),
    error: (message, ...args) => console.error(`%c${prefix} ✖ ${message}`, STYLES.error, ...args),
    debug: (message, ...args) => console.debug(`%c${prefix} · ${message}`, STYLES.muted, ...args),
    errorOnce(label, error) {
      const key = `${label}:${error instanceof Error ? error.message : String(error)}`
      if (reported.has(key)) return
      reported.add(key)
      logger.error(label, error)
    }
  }
  return logger
}
