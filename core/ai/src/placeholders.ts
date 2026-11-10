export interface Field {
	key: string
	label: string
	long: boolean
	value?: string
}

const TOKEN = /\{\{\s*([^{}]+?)\s*\}\}/g
const LONG_HINT = /text|body|content|list|items?|description|code|paste|notes|context|article/i

const labelOf = (key: string): string => {
	const raw = key.startsWith('ask:') ? key.slice(4).trim() : key.replace(/[_-]+/g, ' ')
	return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export const findFields = (text: string, isResolved: (key: string) => boolean): Field[] => {
	const fields: Field[] = []
	for (const match of text.matchAll(TOKEN)) {
		const key = match[1] ?? ''
		if (!key || isResolved(key) || fields.some((field) => field.key === key)) continue
		fields.push({ key, label: labelOf(key), long: LONG_HINT.test(key) })
	}
	return fields
}

export const applyValues = (text: string, values: Readonly<Record<string, string>>): string => text.replace(TOKEN, (match, key: string) => Object.prototype.hasOwnProperty.call(values, key) ? values[key] ?? '' : match)
