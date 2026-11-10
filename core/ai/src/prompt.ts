import { sleep, waitFor } from '@nolly/core'
import { automate } from './automation'
import { readComposer } from './composer'
import type { ComposerKit } from './composer'

export type PromptSender = (prompt: string, signal?: AbortSignal) => Promise<boolean>

export const createPromptSender = ({ findComposer, writeComposer, sendComposer }: Pick<ComposerKit, 'findComposer' | 'writeComposer' | 'sendComposer'>): PromptSender => (prompt, signal) => automate(async () => {
	for (let attempt = 0; attempt < 2; attempt++) {
		const composer = await waitFor(findComposer, { timeout: 15_000, signal })
		if (!composer) return false
		if ((await writeComposer(composer, prompt)) && (await sendComposer(composer))) return true
		if (readComposer(composer).trim() === '') return true
		await sleep(1_500, signal)
	}
	return false
})
