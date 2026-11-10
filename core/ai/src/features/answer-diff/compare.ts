export type DiffKind = 'same' | 'added' | 'removed'

export interface DiffLine {
	readonly kind: DiffKind
	readonly text: string
}

export interface DiffResult {
	readonly lines: readonly DiffLine[]
	readonly added: number
	readonly removed: number
	readonly same: number
	readonly coarse: boolean
}

const MAX_CELLS = 250_000

export const compareAnswers = (before: string, after: string): DiffResult => {
	const split = (text: string): string[] => text === '' ? [] : text.replace(/\r\n?/g, '\n').split('\n')
	const a = split(before)
	const b = split(after)
	let prefix = 0
	let suffix = 0
	while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++
	while (suffix < a.length - prefix && suffix < b.length - prefix && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++
	const left = a.slice(prefix, a.length - suffix)
	const right = b.slice(prefix, b.length - suffix)
	const output: DiffLine[] = a.slice(0, prefix).map((text) => ({ kind: 'same', text }))
	const coarse = (left.length + 1) * (right.length + 1) > MAX_CELLS
	if (coarse) {
		output.push(...left.map((text): DiffLine => ({ kind: 'removed', text })), ...right.map((text): DiffLine => ({ kind: 'added', text })))
	} else {
		const width = right.length + 1
		const matrix = new Uint32Array((left.length + 1) * width)
		for (let i = left.length - 1; i >= 0; i--) {
			for (let j = right.length - 1; j >= 0; j--) {
				matrix[i * width + j] = left[i] === right[j] ? matrix[(i + 1) * width + j + 1]! + 1 : Math.max(matrix[(i + 1) * width + j]!, matrix[i * width + j + 1]!)
			}
		}
		let i = 0
		let j = 0
		while (i < left.length || j < right.length) {
			if (i < left.length && j < right.length && left[i] === right[j]) {
				output.push({ kind: 'same', text: left[i++]! })
				j++
			} else if (i < left.length && (j === right.length || matrix[(i + 1) * width + j]! >= matrix[i * width + j + 1]!)) {
				output.push({ kind: 'removed', text: left[i++]! })
			} else {
				output.push({ kind: 'added', text: right[j++]! })
			}
		}
	}
	if (suffix) output.push(...a.slice(a.length - suffix).map((text): DiffLine => ({ kind: 'same', text })))
	return {
		lines: output,
		added: output.filter((line) => line.kind === 'added').length,
		removed: output.filter((line) => line.kind === 'removed').length,
		same: output.filter((line) => line.kind === 'same').length,
		coarse
	}
}

export const diffText = (result: DiffResult): string => ['--- baseline', '+++ revision', ...result.lines.map((line) => `${line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' '}${line.text}`)].join('\n')
