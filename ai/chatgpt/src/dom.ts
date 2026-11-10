import { createUiMarker } from '@nolly/core'

export const uiMarker = createUiMarker('data-bc-root')
export const markUi = uiMarker.mark
export const isOwnUi = uiMarker.isOwn
