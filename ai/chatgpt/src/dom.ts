import { createUiMarker } from '@nolly/core'

export const uiMarker = createUiMarker('data-bc-root')
export const UI_ROOT_ATTRIBUTE = uiMarker.attribute
export const markUi = uiMarker.mark
export const isOwnUi = uiMarker.isOwn
