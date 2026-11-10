type Signal = readonly [language: string, pattern: RegExp, weight: number]

const SIGNALS: readonly Signal[] = [
  ['python', /^\s*def \w+\(.*\)\s*(?:->.*)?:/m, 4], ['python', /^\s*(?:elif|except|finally)\b.*:/m, 3], ['python', /^\s*import [\w.]+(?: as \w+)?\s*$/m, 3],
  ['python', /^\s*from [\w.]+ import /m, 3], ['python', /\bif __name__\b/, 5], ['python', /\bself\./, 1], ['python', /\bf"[^"]*\{/, 2], ['python', /\bprint\(/, 1],
  ['javascript', /\b(?:const|let)\s+\w+\s*=/, 2], ['javascript', /=>/, 1], ['javascript', /\bfunction\b/, 1], ['javascript', /console\.\w+\(/, 3],
  ['javascript', /\brequire\(/, 3], ['javascript', /^\s*import .+ from ['"]/m, 3], ['javascript', /\bexport (?:default|const|function|class)\b/, 3], ['javascript', /\b(?:document|window)\./, 2],
  ['bash', /^\s*\$ \S/m, 3], ['bash', /^\s*(?:sudo|apt(?:-get)?|brew|npm|pnpm|yarn|pip3?|git|cd|ls|mkdir|curl|wget|chmod|docker|echo|export|bun)\b/m, 3],
  ['bash', /\s&&\s/, 1], ['bash', /\$\{?\w+\}?/, 1], ['bash', /^\s*(?:if|for|while) .*; (?:then|do)\b/m, 3],
  ['sql', /\bSELECT\b[\s\S]*\bFROM\b/i, 5], ['sql', /\b(?:INSERT INTO|UPDATE \w+ SET|DELETE FROM|CREATE (?:TABLE|INDEX|VIEW)|ALTER TABLE|DROP TABLE)\b/i, 5],
  ['html', /<!doctype html|<html[\s>]/i, 6], ['html', /<\/?(?:div|span|p|a|ul|li|head|body|script|style|meta|link|h[1-6]|button|input|form|table)\b[^>]*>/i, 3],
  ['xml', /^\s*<\?xml/, 6], ['xml', /<\/\w+>/, 1],
  ['css', /[.#]?[\w-]+(?:\s*,\s*[.#]?[\w-]+)*\s*\{[^}]*:[^}]*\}/, 4], ['css', /@(?:media|import|keyframes|font-face)\b/, 3],
  ['yaml', /^(?:\s*[\w.-]+:.*\n){2,}/, 3], ['yaml', /^\s*- \w+/m, 1],
  ['toml', /^\[[\w.-]+\]\s*$/m, 3], ['toml', /^[\w.-]+\s*=\s*["\d[tf]/m, 2],
  ['go', /^package \w+/m, 5], ['go', /\bfunc\b.*\{/, 2], ['go', /:=/, 2], ['go', /\bfmt\.\w+/, 3],
  ['rust', /\bfn \w+\(/, 4], ['rust', /\blet mut\b/, 4], ['rust', /\bimpl\b|\bpub (?:fn|struct)\b/, 3], ['rust', /println!\(/, 4],
  ['java', /\bpublic (?:static )?(?:class|void|interface)\b/, 4], ['java', /System\.out\.print/, 5], ['java', /^import java\./m, 5],
  ['csharp', /^using System/m, 5], ['csharp', /Console\.Write/, 4], ['csharp', /\bnamespace \w+/, 2],
  ['c', /#include\s*[<"]/, 5], ['c', /\bint main\s*\(/, 4], ['c', /\bprintf\(/, 3],
  ['cpp', /std::|\bcout\b|template\s*</, 5], ['cpp', /#include\s*<(?:iostream|vector|string|map)>/, 5],
  ['php', /<\?php/, 6], ['ruby', /^\s*def \w+.*\n[\s\S]*^\s*end\b/m, 4], ['ruby', /\bputs\b|\bdo \|\w+\|/, 2],
  ['kotlin', /\bfun \w+\(/, 4], ['kotlin', /\bval \w+/, 2], ['swift', /\bguard let\b|\bfunc \w+\(.*\)\s*->/, 4],
  ['dockerfile', /^FROM \S+/m, 5], ['dockerfile', /^(?:RUN|CMD|COPY|ENTRYPOINT|WORKDIR|EXPOSE|ENV) /m, 3],
  ['diff', /^diff --git|^@@ .* @@|^\+\+\+ |^--- /m, 6], ['markdown', /^#{1,6} \S/m, 2], ['markdown', /^```/m, 3],
  ['powershell', /\bGet-\w+|\$env:\w+|\bWrite-Host\b/, 4]
]

const TYPESCRIPT_SIGNALS: readonly RegExp[] = [/:\s*(?:string|number|boolean|void|any|unknown)\b/, /\binterface \w+/, /^\s*type \w+\s*=/m, /\bas const\b/, /\benum \w+/]
const SHEBANG = /^#!.*\b(bash|sh|zsh|python3?|node|ruby|php|pwsh)\b/
const MIN_SCORE = 3

const SHEBANG_LANGUAGE: Readonly<Record<string, string>> = { bash: 'bash', sh: 'bash', zsh: 'bash', python: 'python', python3: 'python', node: 'javascript', ruby: 'ruby', php: 'php', pwsh: 'powershell' }

export const guessLanguage = (text: string): string | null => {
  const sample = text.slice(0, 6_000).trim()
  if (!sample) return null
  if (/^[[{]/.test(sample)) {
    try {
      JSON.parse(text)
      return 'json'
    } catch {
      sample.length
    }
  }
  const shebang = SHEBANG.exec(sample)?.[1]
  if (shebang) return SHEBANG_LANGUAGE[shebang] ?? null
  const scores = new Map<string, number>()
  for (const [language, pattern, weight] of SIGNALS) if (pattern.test(sample)) scores.set(language, (scores.get(language) ?? 0) + weight)
  const typed = TYPESCRIPT_SIGNALS.filter((pattern) => pattern.test(sample)).length
  const javascript = scores.get('javascript') ?? 0
  if (typed >= 1 && javascript + typed * 3 >= MIN_SCORE) scores.set('typescript', javascript + typed * 3)
  const best = [...scores.entries()].sort(([, a], [, b]) => b - a)[0]
  return best && best[1] >= MIN_SCORE ? best[0] : null
}