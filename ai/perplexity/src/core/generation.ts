import { createGenerationKit } from '@nolly/ai'
import { isOwnUi } from './dom'

export const { isGenerating, waitForResponse } = createGenerationKit({ adapter: { isOwnUi } })
