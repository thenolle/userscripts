export const fuzzyScore = (query: string, text: string): number => {
  if (!query) return 1
  const needle = query.toLowerCase()
  const haystack = text.toLowerCase()
  let score = 0
  let position = 0
  let streak = 0
  for (const char of needle) {
    const found = haystack.indexOf(char, position)
    if (found === -1) return 0
    streak = found === position ? streak + 1 : 0
    const boundary = found === 0 || /[\s\-_:.]/.test(haystack[found - 1] ?? '')
    score += 1 + streak * 2 + (boundary ? 3 : 0) - Math.min(found - position, 5) * 0.2
    position = found + 1
  }
  return Math.max(score, 0.01)
}