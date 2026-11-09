export interface ParsedVersion {
  readonly numbers: readonly number[]
  readonly pre: readonly (string | number)[]
}

const identifier = (part: string): string | number => (/^\d+$/.test(part) ? Number(part) : part)

export const parseVersion = (input: string): ParsedVersion => {
  const [withoutBuild = ''] = input.trim().replace(/^v/i, '').split('+')
  const dash = withoutBuild.indexOf('-')
  const main = dash === -1 ? withoutBuild : withoutBuild.slice(0, dash)
  const pre = dash === -1 ? '' : withoutBuild.slice(dash + 1)
  return {
    numbers: main.split('.').map((part) => Number.parseInt(part, 10) || 0),
    pre: pre ? pre.split('.').map(identifier) : []
  }
}

const compareIdentifiers = (a: string | number, b: string | number): number => {
  if (typeof a === 'number' && typeof b === 'number') return Math.sign(a - b)
  if (typeof a === 'number') return -1
  if (typeof b === 'number') return 1
  return a < b ? -1 : a > b ? 1 : 0
}

export const compareVersions = (a: string, b: string): -1 | 0 | 1 => {
  const left = parseVersion(a)
  const right = parseVersion(b)
  for (let index = 0; index < Math.max(left.numbers.length, right.numbers.length); index++) {
    const difference = (left.numbers[index] ?? 0) - (right.numbers[index] ?? 0)
    if (difference !== 0) return difference > 0 ? 1 : -1
  }
  if (!left.pre.length && !right.pre.length) return 0
  if (!left.pre.length) return 1
  if (!right.pre.length) return -1
  for (let index = 0; index < Math.max(left.pre.length, right.pre.length); index++) {
    const x = left.pre[index]
    const y = right.pre[index]
    if (x === undefined) return -1
    if (y === undefined) return 1
    const result = compareIdentifiers(x, y)
    if (result !== 0) return result > 0 ? 1 : -1
  }
  return 0
}

export const isNewerVersion = (candidate: string, current: string): boolean => compareVersions(candidate, current) > 0
