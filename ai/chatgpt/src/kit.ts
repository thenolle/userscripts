import { createComposerKit, createPromptSender } from '@nolly/ai'
import { chatgptAdapter } from './adapter'

export const sendPrompt = createPromptSender(createComposerKit(chatgptAdapter))
