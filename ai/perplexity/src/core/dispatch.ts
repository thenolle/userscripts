import { createPromptSender } from '@nolly/ai'
import { findComposer, sendComposer, writeComposer } from './composer'

export const sendPrompt = createPromptSender({ findComposer, writeComposer, sendComposer })
