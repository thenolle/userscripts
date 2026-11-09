export type TokenType = 'comment' | 'string' | 'number' | 'keyword' | 'fn' | 'type' | 'tag' | 'attr' | 'key' | 'plain'

export interface Token {
  type: TokenType
  text: string
}

type Rule = readonly [type: TokenType, source: string]

const EOF = String.raw`(?![\s\S])`
const DQ = String.raw`"(?:\\.|[^"\\\n])*"?`
const SQ = String.raw`'(?:\\.|[^'\\\n])*'?`
const BT = String.raw`\x60(?:\\[\s\S]|[^\x60\\])*\x60?`
const NUM = String.raw`\b(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)\b`
const words = (list: string): string => String.raw`\b(?:${list.trim().split(/\s+/).join('|')})\b`

const JS = 'break case catch class const continue default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while yield async await true false null undefined from as interface type enum implements namespace declare readonly public private protected keyof satisfies'
const SHELL = 'if then else elif fi for while do done case esac function in return exit export local echo cd sudo git bun npm'

const compile = (rules: readonly Rule[], flags = 'g'): { rules: readonly Rule[]; regex: RegExp } => ({
  rules,
  regex: new RegExp(rules.map(([, source], index) => `(?<r${index}>${source})`).join('|'), flags)
})

const SETS: Readonly<Record<string, ReturnType<typeof compile>>> = {
  js: compile([['comment', String.raw`\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|${EOF})`], ['string', `${DQ}|${SQ}|${BT}`], ['number', NUM], ['keyword', words(JS)], ['fn', String.raw`\b[A-Za-z_$][\w$]*(?=\s*\()`], ['type', String.raw`\b[A-Z][A-Za-z0-9_]*\b`]]),
  json: compile([['key', String.raw`"(?:\\.|[^"\\\n])*"(?=\s*:)`], ['string', DQ], ['number', NUM], ['keyword', words('true false null')]]),
  sh: compile([['comment', String.raw`(?:^|(?<=\s))#[^\n]*`], ['string', `${DQ}|${SQ}`], ['attr', String.raw`\$\{?[\w@#?*-]+\}?`], ['key', String.raw`(?<=\s)--?[A-Za-z][\w-]*`], ['keyword', words(SHELL)]], 'gm'),
  yaml: compile([['comment', String.raw`#[^\n]*`], ['key', String.raw`^[ \t-]*[\w.\-/"']+(?=\s*:(?:\s|${EOF}))`], ['string', `${DQ}|${SQ}`], ['number', NUM], ['keyword', words('true false null yes no on off')]], 'gm'),
  css: compile([['comment', String.raw`\/\*[\s\S]*?(?:\*\/|${EOF})`], ['string', `${DQ}|${SQ}`], ['keyword', String.raw`@[\w-]+`], ['key', String.raw`[\w-]+(?=\s*:)`], ['number', String.raw`#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|r?em|%|vh|vw|ms|s|deg|fr)?`], ['type', String.raw`[.#][\w-]+`]]),
  html: compile([['comment', String.raw`<!--[\s\S]*?(?:-->|${EOF})`], ['tag', String.raw`<\/?[A-Za-z][\w:.-]*|\/?>`], ['attr', String.raw`[\w:@.-]+(?==)`], ['string', `${DQ}|${SQ}`]], 'gi')
}

const ALIAS: Readonly<Record<string, string>> = { ts: 'js', tsx: 'js', jsx: 'js', js: 'js', javascript: 'js', typescript: 'js', json: 'json', sh: 'sh', bash: 'sh', shell: 'sh', zsh: 'sh', yaml: 'yaml', yml: 'yaml', css: 'css', html: 'html', xml: 'html' }

export const tokenize = (code: string, language: string): Token[] => {
  const set = SETS[ALIAS[language] ?? '']
  if (!set) return [{ type: 'plain', text: code }]
  const tokens: Token[] = []
  let last = 0
  for (const match of code.matchAll(set.regex)) {
    const start = match.index ?? 0
    if (start > last) tokens.push({ type: 'plain', text: code.slice(last, start) })
    const index = set.rules.findIndex((_, position) => match.groups?.[`r${position}`] !== undefined)
    tokens.push({ type: set.rules[index]?.[0] ?? 'plain', text: match[0] })
    last = start + match[0].length
  }
  if (last < code.length) tokens.push({ type: 'plain', text: code.slice(last) })
  return tokens
}