import { applyValues, findFields, type Field } from '../../core/placeholders'
import { currentSelection } from '../../core/selection'
import { askFields } from '../../ui/placeholder-dialog'

const BUILTINS = new Set(['clipboard', 'selection', 'date', 'time', 'url', 'title'])

const readClipboard = (): Promise<string> => navigator.clipboard.readText().catch(() => '')

export const expandPrompt = async (body: string, promptTitle: string): Promise<string | null> => {
  const now = new Date()
  const known: Record<string, string> = {
    clipboard: body.includes('{{clipboard') ? await readClipboard() : '',
    selection: currentSelection(),
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    url: location.href,
    title: document.title
  }
  const empty = (key: string): boolean => BUILTINS.has(key) && !known[key]
  const fields: Field[] = findFields(body, (key) => BUILTINS.has(key) && !empty(key))
  const unresolved = findFields(body, (key) => !BUILTINS.has(key) || !empty(key)).filter((field) => !fields.some((other) => other.key === field.key))
  const toAsk = [...fields, ...unresolved]
  const values: Record<string, string> = Object.fromEntries(Object.entries(known).filter(([key]) => !empty(key)))
  if (toAsk.length) {
    const answers = await askFields(toAsk, { title: promptTitle || 'Fill in the blanks', description: 'This prompt has placeholders. Type what should replace each one.', confirm: 'Insert prompt' })
    if (!answers) return null
    Object.assign(values, answers)
  }
  return applyValues(body, values)
}