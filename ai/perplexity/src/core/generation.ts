import { createGenerationKit } from '@nolly/ai'
import { isOwnUi } from './dom'

export const generationKit = createGenerationKit({ adapter: { isOwnUi } })
export const { isGenerating, waitForResponse } = generationKit
