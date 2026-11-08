const PREFIX = '[Better Perplexity]'
const WIDTH = 42

const STYLES = {
  banner: 'color: #c4b5fd; font-weight: bold; font-size: 13px; line-height: 1.5',
  success: 'color: #86efac; font-weight: bold',
  info: 'color: #93c5fd',
  warning: 'color: #fcd34d; font-weight: bold',
  error: 'color: #fca5a5; font-weight: bold',
  muted: 'color: #a1a1aa'
} as const

const reported = new Set<string>()

const center = (text: string): string => {
  const left = Math.floor((WIDTH - text.length) / 2)
  return `│${' '.repeat(left)}${text}${' '.repeat(WIDTH - text.length - left)}│`
}

export const logger = {
  banner(version: string): void {
    const blank = center('')
    const lines = [`╭${'─'.repeat(WIDTH)}╮`, blank, center('BETTER PERPLEXITY'), blank, center(`v${version}`), blank, `╰${'─'.repeat(WIDTH)}╯`]
    console.log(`%c${lines.join('\n')}`, STYLES.banner)
  },
  success(message: string, ...args: unknown[]): void {
    console.log(`%c${PREFIX} ✔ ${message}`, STYLES.success, ...args)
  },
  info(message: string, ...args: unknown[]): void {
    console.info(`%c${PREFIX} ℹ ${message}`, STYLES.info, ...args)
  },
  warning(message: string, ...args: unknown[]): void {
    console.warn(`%c${PREFIX} ⚠ ${message}`, STYLES.warning, ...args)
  },
  error(message: string, ...args: unknown[]): void {
    console.error(`%c${PREFIX} ✖ ${message}`, STYLES.error, ...args)
  },
  debug(message: string, ...args: unknown[]): void {
    console.debug(`%c${PREFIX} · ${message}`, STYLES.muted, ...args)
  },
  errorOnce(label: string, error: unknown): void {
    const key = `${label}:${error instanceof Error ? error.message : String(error)}`
    if (reported.has(key)) return
    reported.add(key)
    this.error(label, error)
  }
}