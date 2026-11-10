export interface Field {
	key: string
	label: string
	long: boolean
	value?: string
}

interface Token {
	readonly start: number
	readonly end: number
	readonly key: string
}

const LONG_HINT = /text|body|content|list|items?|description|code|paste|notes|context|article/i

const labelOf = (key: string): string => {
	const raw = key.startsWith('ask:') ? key.slice(4).trim() : key.replace(/[_-]+/g, ' ')
	return raw.charAt(0).toUpperCase() + raw.slice(1)
}

const scanTokens = (text: string, visit: (token: Token) => void): void => {
	let start = -1

	for (let index = 0; index < text.length; index++) {
		const character = text[index]

		if (character === '{') {
			start = index > 0 && text[index - 1] === '{' ? index - 1 : -1
			continue
		}

		if (character !== '}') continue

		if (start >= 0 && text[index + 1] === '}') {
			const key = text.slice(start + 2, index).trim()
			if (key) visit({ start, end: index + 2, key })
			start = -1
			index++
		} else {
			start = -1
		}
	}
}

export const findFields = (text: string, isResolved: (key: string) => boolean): Field[] => {
	const fields: Field[] = []
	const seen = new Set<string>()

	scanTokens(text, ({ key }) => {
		if (seen.has(key)) return
		seen.add(key)
		if (!isResolved(key)) fields.push({ key, label: labelOf(key), long: LONG_HINT.test(key) })
	})

	return fields
}

export const applyValues = (text: string, values: Readonly<Record<string, string>>): string => {
	const parts: string[] = []
	let cursor = 0

	scanTokens(text, ({ start, end, key }) => {
		parts.push(text.slice(cursor, start))
		parts.push(Object.prototype.hasOwnProperty.call(values, key) ? values[key] ?? '' : text.slice(start, end))
		cursor = end
	})

	parts.push(text.slice(cursor))
	return parts.join('')
}
