import { sleep, waitFor } from '@nolly/core'
import { automate } from './automation'
import { findComposer, readComposer, sendComposer, writeComposer } from './composer'

export const sendPrompt = (prompt: string, signal?: AbortSignal): Promise<boolean> => automate(async () => {
	for (let attempt = 0; attempt < 2; attempt++) {
		const composer = await waitFor(findComposer, { timeout: 15_000, signal })
		if (!composer) return false
		if ((await writeComposer(composer, prompt)) && (await sendComposer(composer))) return true
		if (readComposer(composer).trim() === '') return true
		await sleep(1_500, signal)
	}
	return false
})
