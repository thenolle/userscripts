import { createComposerKit, createPromptSender } from '@nolly/ai'
import { chatgptAdapter } from './adapter'

export const composerKit = createComposerKit(chatgptAdapter)
export const sendPrompt = createPromptSender(composerKit)
