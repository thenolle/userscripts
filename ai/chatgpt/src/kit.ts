import { createComposerKit, createGenerationKit, createPromptSender } from '@nolly/ai'
import { chatgptAdapter } from './adapter'
import { session } from './runtime'

export const composerKit = createComposerKit(chatgptAdapter)
export const generationKit = createGenerationKit({ adapter: chatgptAdapter, isStreaming: () => session.generating })
export const sendPrompt = createPromptSender(composerKit)
