const FENCE = /```[\s\S]*?(?:```|$)/g
const WIDE = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g

export const estimateTokens = (text: string, asCode = false): number => {
  if (!text) return 0
  let code = asCode ? text.length : 0
  const prose = asCode ? '' : text.replace(FENCE, (block) => {
    code += block.length
    return ''
  })
  const wide = prose.match(WIDE)?.length ?? 0
  return Math.ceil((prose.length - wide) / 4 + wide + code / 3.2)
}
