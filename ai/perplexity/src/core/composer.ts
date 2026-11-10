import { createComposerKit } from '@nolly/ai'
import { isOwnUi } from './dom'

export const { editableFrom, findComposer, writeComposer, sendComposer, attachFile } = createComposerKit({ isOwnUi })
