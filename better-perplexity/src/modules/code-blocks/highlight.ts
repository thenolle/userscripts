import { createElement } from '../../core/dom'
import { createLine } from './lines'

type TokenType = 'comment' | 'string' | 'number' | 'keyword' | 'fn' | 'type' | 'tag' | 'attr' | 'key'
type Rule = readonly [type: TokenType, source: string]

interface RuleSet {
  readonly rules: readonly Rule[]
  readonly regex: RegExp
}

const EOF = String.raw`(?![\s\S])`
const DQ = String.raw`"(?:\\.|[^"\\\n])*"?`
const SQ = String.raw`'(?:\\.|[^'\\\n])*'?`
const BT = String.raw`\x60(?:\\[\s\S]|[^\x60\\])*\x60?`
const NUM = String.raw`\b(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)\b`
const BLOCK = String.raw`\/\*[\s\S]*?(?:\*\/|${EOF})`
const LINE = String.raw`\/\/[^\n]*`
const HASH = String.raw`#[^\n]*`
const CALL = String.raw`\b[A-Za-z_$][\w$]*(?=\s*\()`
const CAP = String.raw`\b[A-Z][A-Za-z0-9_]*\b`
const TRIPLE = String.raw`"""[\s\S]*?(?:"""|${EOF})|'''[\s\S]*?(?:'''|${EOF})`

const words = (list: string): string => String.raw`\b(?:${list.trim().split(/\s+/).join('|')})\b`

const KEYWORDS: Readonly<Record<string, string>> = {
  javascript: 'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async await true false null undefined from as',
  typescript: 'interface type enum implements namespace declare readonly abstract public private protected keyof infer is satisfies string number boolean any unknown never object',
  go: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil',
  rust: 'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while',
  java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new null package private protected public return short static super switch synchronized this throw throws transient true false try void volatile while var record',
  c: 'auto break case char const continue default do double else enum extern float for goto if inline int long register return short signed sizeof static struct switch typedef union unsigned void volatile while class namespace template typename using new delete public private protected virtual nullptr true false bool this operator',
  csharp: 'using namespace string object bool decimal foreach in is as async await var readonly override virtual interface struct enum delegate event get set public private protected internal static class new return if else for while switch case break continue try catch finally throw null true false void int',
  kotlin: 'fun val var class object interface when if else for while return break continue is in as import package null true false this super override open data sealed suspend companion init',
  swift: 'func let var class struct enum protocol extension import return if else guard switch case default for in while break continue nil true false self super init deinit throws try catch defer public private internal static',
  php: 'function class public private protected static return if else elseif foreach for while switch case break continue new try catch throw namespace use echo null true false array isset empty',
  ruby: 'def end class module if elsif else unless while until for in do begin rescue ensure return yield self nil true false and or not puts require include',
  python: 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield self',
  shell: 'if then else elif fi for while do done case esac function in return exit export local echo cd sudo',
  powershell: 'if else elseif foreach for while switch function param return try catch finally throw true false null',
  sql: 'select from where and or not in is null insert into values update set delete create table alter drop index view join left right inner outer on group by order having limit offset as distinct union all case when then else end primary key foreign references default unique exists between like asc desc count sum avg min max'
}

const clike = (language: string, extra = ''): Rule[] => [
  ['comment', `${LINE}|${BLOCK}`], ['string', `${DQ}|${SQ}|${BT}`], ['number', NUM],
  ['keyword', words(`${KEYWORDS[language] ?? ''} ${extra}`)], ['fn', CALL], ['type', CAP]
]

const hashLanguage = (language: string, strings = `${DQ}|${SQ}`): Rule[] => [
  ['comment', HASH], ['string', strings], ['number', NUM], ['keyword', words(KEYWORDS[language] ?? '')], ['fn', CALL], ['type', CAP]
]

const compile = (rules: readonly Rule[], flags = 'g'): RuleSet => ({
  rules,
  regex: new RegExp(rules.map(([, source], index) => `(?<r${index}>${source})`).join('|'), flags)
})

const RULESETS: Readonly<Record<string, RuleSet>> = {
  javascript: compile(clike('javascript')),
  typescript: compile(clike('javascript', KEYWORDS['typescript'])),
  go: compile(clike('go')),
  rust: compile(clike('rust')),
  java: compile(clike('java')),
  c: compile(clike('c')),
  csharp: compile(clike('csharp')),
  kotlin: compile(clike('kotlin')),
  swift: compile(clike('swift')),
  php: compile([['comment', `${LINE}|${HASH}|${BLOCK}`], ...clike('php').slice(1)]),
  python: compile([['attr', String.raw`^[ \t]*@[\w.]+`], ...hashLanguage('python', `${TRIPLE}|${DQ}|${SQ}`)], 'gm'),
  ruby: compile(hashLanguage('ruby')),
  bash: compile([['comment', String.raw`(?:^|(?<=\s))#[^\n]*`], ['string', `${DQ}|${SQ}`], ['attr', String.raw`\$\{?[\w@#?*-]+\}?`], ['key', String.raw`(?<=\s)--?[A-Za-z][\w-]*`], ['keyword', words(KEYWORDS['shell'] ?? '')], ['number', NUM]], 'gm'),
  powershell: compile([['comment', HASH], ['string', `${DQ}|${SQ}`], ['attr', String.raw`\$[\w:]+`], ['keyword', words(KEYWORDS['powershell'] ?? '')], ['fn', String.raw`\b[A-Z][a-z]+-[A-Za-z]+\b`]]),
  json: compile([['key', String.raw`"(?:\\.|[^"\\\n])*"(?=\s*:)`], ['string', DQ], ['number', NUM], ['keyword', words('true false null')]]),
  yaml: compile([['comment', HASH], ['key', String.raw`^[ \t-]*[\w.\-/"']+(?=\s*:(?:\s|${EOF}))`], ['string', `${DQ}|${SQ}`], ['number', NUM], ['keyword', words('true false null yes no on off')]], 'gm'),
  toml: compile([['comment', HASH], ['tag', String.raw`^\[[^\]\n]+\]`], ['key', String.raw`^[\w.\-]+(?=\s*=)`], ['string', `${DQ}|${SQ}`], ['number', NUM], ['keyword', words('true false')]], 'gm'),
  html: compile([['comment', String.raw`<!--[\s\S]*?(?:-->|${EOF})`], ['keyword', String.raw`<!DOCTYPE[^>]*>`], ['tag', String.raw`<\/?[A-Za-z][\w:.-]*|\/?>`], ['attr', String.raw`[\w:@.-]+(?==)`], ['string', `${DQ}|${SQ}`]], 'gi'),
  css: compile([['comment', BLOCK], ['string', `${DQ}|${SQ}`], ['keyword', String.raw`@[\w-]+`], ['key', String.raw`[\w-]+(?=\s*:)`], ['number', String.raw`#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|r?em|%|vh|vw|ms|s|deg|fr)?`], ['type', String.raw`[.#][\w-]+`]]),
  sql: compile([['comment', String.raw`--[^\n]*|${BLOCK}`], ['string', `${SQ}|${DQ}`], ['number', NUM], ['keyword', words(KEYWORDS['sql'] ?? '')], ['fn', CALL]], 'gi'),
  dockerfile: compile([['comment', HASH], ['string', `${DQ}|${SQ}`], ['keyword', String.raw`^(?:FROM|RUN|CMD|COPY|ADD|ENTRYPOINT|ENV|EXPOSE|WORKDIR|USER|ARG|LABEL|VOLUME|AS)\b`]], 'gm')
}

const RULESET_OF: Readonly<Record<string, string>> = {
  cpp: 'c', xml: 'html', objectivec: 'c', dart: 'java', scala: 'java', groovy: 'java',
  solidity: 'javascript', perl: 'ruby', zig: 'rust', nim: 'python', julia: 'python'
}

interface Token {
  type: TokenType | 'plain'
  text: string
}

const tokenize = (text: string, { rules, regex }: RuleSet): Token[] => {
  const tokens: Token[] = []
  let last = 0
  for (const match of text.matchAll(regex)) {
    const start = match.index ?? 0
    if (start > last) tokens.push({ type: 'plain', text: text.slice(last, start) })
    const index = rules.findIndex((_, position) => match.groups?.[`r${position}`] !== undefined)
    tokens.push({ type: rules[index]?.[0] ?? 'plain', text: match[0] })
    last = start + match[0].length
  }
  if (last < text.length) tokens.push({ type: 'plain', text: text.slice(last) })
  return tokens
}

export const highlightLines = (text: string, language: string): HTMLElement[] | null => {
  const set = RULESETS[RULESET_OF[language] ?? language]
  if (!set) return null
  const lines: HTMLElement[] = []
  let current = createLine()
  lines.push(current.line)
  for (const token of tokenize(text, set)) {
    token.text.split('\n').forEach((segment, index) => {
      if (index > 0) {
        current = createLine()
        lines.push(current.line)
      }
      if (!segment) return
      if (token.type === 'plain') current.text.appendChild(document.createTextNode(segment))
      else current.text.appendChild(createElement('span', `bp-tok bp-tok-${token.type}`, segment))
    })
  }
  return lines
}