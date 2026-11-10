import { createComposerKit } from '@nolly/ai'
import { isOwnUi } from './dom'

export const composerKit = createComposerKit({ isOwnUi })
export const { editableFrom, findComposer, writeComposer, sendComposer, attachFile } = composerKit
