import { createGenerationKit } from '@nolly/ai'
import { isOwnUi } from './dom'

export type { ResponseWaitOptions } from '@nolly/ai'

export const { isGenerating, waitForResponse } = createGenerationKit({ adapter: { isOwnUi } })
