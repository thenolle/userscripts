const NOISE = /\/rest\/(?:event|events|analytics|metrics|telemetry|log|logs|rate-limit|user\/settings|user\/info|auth|experiments|flags|ping)\b/i
const ASK = /\/rest\/sse\/|\/rest\/(?:agent|agents|computer|ask|query|chat|conversation)\b|perplexity_ask/i

const pathOf = (url: string): string => {
  try {
    return new URL(url, location.origin).pathname
  } catch {
    return url
  }
}

export const isAskRequest = (method: string, url: string): boolean => {
  const path = pathOf(url)
  return method === 'POST' && !NOISE.test(path) && ASK.test(path)
}
