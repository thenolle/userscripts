let depth = 0

export const isAutomating = (): boolean => depth > 0

export const automate = async <T>(task: () => Promise<T>): Promise<T> => {
  depth++
  try {
    return await task()
  } finally {
    depth--
  }
}
