export interface Cancelable {
  cancel(): void
}

export const debounce = <A extends unknown[]>(fn: (...args: A) => void, ms: number): ((...args: A) => void) & Cancelable => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const wrapped = (...args: A): void => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
  return Object.assign(wrapped, { cancel: () => clearTimeout(timer) })
}

export const throttle = <A extends unknown[]>(fn: (...args: A) => void, ms: number): ((...args: A) => void) & Cancelable => {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: A | null = null
  const run = (args: A): void => {
    last = Date.now()
    pending = null
    fn(...args)
  }
  const wrapped = (...args: A): void => {
    const remaining = ms - (Date.now() - last)
    if (remaining <= 0) {
      clearTimeout(timer)
      timer = undefined
      run(args)
      return
    }
    pending = args
    timer ??= setTimeout(() => {
      timer = undefined
      if (pending) run(pending)
    }, remaining)
  }
  return Object.assign(wrapped, {
    cancel: () => {
      clearTimeout(timer)
      timer = undefined
      pending = null
    }
  })
}

export const once = <T>(fn: () => T): (() => T) => {
  let done = false
  let value: T
  return () => {
    if (!done) {
      value = fn()
      done = true
    }
    return value
  }
}

export const memoizeFor = <T>(fn: () => T, ms: number): (() => T) => {
  let at = -Infinity
  let value: T
  return () => {
    const now = Date.now()
    if (now - at >= ms) {
      value = fn()
      at = now
    }
    return value
  }
}
