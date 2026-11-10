import { guessLanguage } from './guess'
import { isKnownLanguage, languageForFilename, normalizeLanguage } from './languages'

export interface BlockInfo {
  language: string
  filename: string | null
  text: string
}

const LANGUAGE_CLASS = /(?:^|\s)(?:language|lang)-([\w+#.-]+)/i
const FILE_COMMENT = /^(?:\/\/|#|--|\/\*|<!--)\s*(?:file(?:name)?\s*[:=]\s*)?([\w./\\-]+\.[A-Za-z0-9]{1,8})\s*(?:\*\/|-->)?$/
const FILE_LABEL = /^[\w./\\-]+\.[A-Za-z0-9]{1,8}$/
const UI_WORDS = /^(copy|copied|download|save|wrap|code|edit)$/

export const readCode = (pre: HTMLElement): string => ((pre.querySelector('code') ?? pre).textContent ?? '').replace(/\n$/, '')

const shortLeafTexts = (root: HTMLElement, pre: HTMLElement): string[] =>
  [...root.querySelectorAll<HTMLElement>('span, div, p')]
    .filter((element) => !pre.contains(element) && element.children.length === 0)
    .map((element) => element.textContent?.trim() ?? '')
    .filter((text) => text.length > 0 && text.length <= 40)

const declaredLanguage = (pre: HTMLElement, root: HTMLElement): string | null => {
  const code = pre.querySelector('code')
  const fromClass = LANGUAGE_CLASS.exec(`${code?.className ?? ''} ${pre.className}`)?.[1]
  if (fromClass) return fromClass
  const fromData = pre.dataset['language'] ?? pre.dataset['lang'] ?? code?.dataset['language']
  if (fromData) return fromData
  return shortLeafTexts(root, pre).find((text) => /^[A-Za-z][\w+#. -]{0,18}$/.test(text) && !UI_WORDS.test(text.toLowerCase())) ?? null
}

export const guessFilename = (text: string, root: HTMLElement, pre: HTMLElement): string | null => {
  const fromComment = FILE_COMMENT.exec(text.split('\n', 1)[0]?.trim() ?? '')?.[1]
  if (fromComment) return fromComment
  return shortLeafTexts(root, pre).find((candidate) => FILE_LABEL.test(candidate)) ?? null
}

export const detectLanguage = (pre: HTMLElement, root: HTMLElement, text: string, filename: string | null): string => {
  const declared = declaredLanguage(pre, root)
  const normalized = declared ? normalizeLanguage(declared) : null
  if (normalized && isKnownLanguage(normalized)) return normalized
  const fromFile = filename ? languageForFilename(filename) : null
  if (fromFile) return fromFile
  return guessLanguage(text) ?? normalized ?? 'text'
}

export const findBlockRoot = (pre: HTMLElement, includeChrome: boolean): HTMLElement => {
  if (!includeChrome) return pre
  const codeLength = (pre.textContent ?? '').length
  let root = pre
  for (let depth = 0; depth < 3; depth++) {
    const parent = root.parentElement
    if (!parent || parent === document.body || parent.querySelectorAll('pre').length !== 1) break
    if ((parent.textContent ?? '').length - codeLength > 120) break
    root = parent
  }
  return root
}

export const analyze = (pre: HTMLElement, root: HTMLElement, text: string): BlockInfo => {
  const filename = guessFilename(text, root, pre)
  return { language: detectLanguage(pre, root, text, filename), filename, text }
}