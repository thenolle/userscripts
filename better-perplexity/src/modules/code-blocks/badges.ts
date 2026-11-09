import { createElement } from '@nolly/core'
import { createIcon } from '../../ui/icons'

type Badge = readonly [label: string, background: string, color: string]

const BADGES: Readonly<Record<string, Badge>> = {
  javascript: ['JS', '#f7df1e', '#000'], typescript: ['TS', '#3178c6', '#fff'], python: ['PY', '#3776ab', '#ffd43b'],
  bash: ['>_', '#3b8f2b', '#fff'], powershell: ['PS', '#012456', '#fff'], batch: ['BAT', '#4d4d4d', '#fff'],
  json: ['{}', '#e9a620', '#000'], yaml: ['YML', '#cb171e', '#fff'], toml: ['TOML', '#9c4221', '#fff'],
  html: ['</>', '#e34f26', '#fff'], xml: ['XML', '#0060ac', '#fff'], css: ['CSS', '#1572b6', '#fff'],
  sql: ['SQL', '#e48e00', '#000'], graphql: ['GQL', '#e10098', '#fff'], protobuf: ['PB', '#4a7fb0', '#fff'],
  go: ['GO', '#00add8', '#fff'], rust: ['RS', '#ce422b', '#fff'], zig: ['ZIG', '#f7a41d', '#000'], nim: ['NIM', '#ffe953', '#000'],
  java: ['JV', '#e76f00', '#fff'], kotlin: ['KT', '#7f52ff', '#fff'], scala: ['SC', '#dc322f', '#fff'], groovy: ['GRV', '#4298b8', '#fff'],
  swift: ['SW', '#f05138', '#fff'], objectivec: ['OBJ', '#438eff', '#fff'], dart: ['DRT', '#0175c2', '#fff'],
  c: ['C', '#00599c', '#fff'], cpp: ['C++', '#00599c', '#fff'], csharp: ['C#', '#68217a', '#fff'],
  php: ['PHP', '#777bb4', '#fff'], ruby: ['RB', '#cc342d', '#fff'], perl: ['PL', '#39457e', '#fff'], lua: ['LUA', '#000080', '#fff'],
  r: ['R', '#276dc3', '#fff'], julia: ['JL', '#9558b2', '#fff'], matlab: ['M', '#e16737', '#fff'],
  haskell: ['HS', '#5d4f85', '#fff'], elixir: ['EX', '#6e4a7e', '#fff'], clojure: ['CLJ', '#5881d8', '#fff'],
  solidity: ['SOL', '#363636', '#fff'], assembly: ['ASM', '#6e4c13', '#fff'], vim: ['VIM', '#019733', '#fff'],
  nginx: ['NGX', '#009639', '#fff'], makefile: ['MK', '#6d8086', '#fff'], dockerfile: ['DK', '#2496ed', '#fff'],
  latex: ['TEX', '#008080', '#fff'], markdown: ['M↓', '#083fa1', '#fff'], diff: ['±', '#6f42c1', '#fff'],
  regex: ['.*', '#6f42c1', '#fff'], http: ['HTTP', '#1f6feb', '#fff'], log: ['LOG', '#6e7681', '#fff'], csv: ['CSV', '#217346', '#fff']
}

export const createLanguageIcon = (language: string): HTMLElement => {
  const badge = BADGES[language]
  if (!badge) {
    const plain = createElement('span', 'bp-lang-icon bp-lang-plain')
    plain.title = 'Plain text'
    plain.appendChild(createIcon('file', 16))
    return plain
  }
  const [label, background, color] = badge
  const element = createElement('span', 'bp-lang-icon bp-lang-badge', label)
  element.style.setProperty('--c', background)
  element.style.color = color
  element.dataset['size'] = String(label.length)
  return element
}