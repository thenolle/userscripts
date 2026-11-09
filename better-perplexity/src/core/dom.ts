import { createUiMarker } from '@nolly/core'

export { createElement, getElement, toElement } from '@nolly/core'

export const marker = createUiMarker('data-bp-root')

export const UI_ROOT_ATTRIBUTE = marker.attribute
export const markUi = marker.mark
export const isOwnUi = marker.isOwn
