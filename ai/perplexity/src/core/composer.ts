import { createComposerKit } from '@nolly/ai'
import { isOwnUi } from './dom'

export { EDITABLE_SELECTOR, isComposerEmpty, isSendButton, readComposer } from '@nolly/ai'

export const { editableFrom, findComposer, writeComposer, sendComposer, attachFile } = createComposerKit({ isOwnUi })
