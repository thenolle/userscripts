import type { createUiMarker } from '@nolly/core'

export type UiMarker = ReturnType<typeof createUiMarker>

export interface ComposerActions {
  readonly first: HTMLElement | null
  readonly submit: HTMLElement | null
}

export interface UiConfig {
  readonly id: string
  readonly title: string
  readonly version: string
  readonly marker: UiMarker
  readonly composerActions?: () => ComposerActions
}

let current: UiConfig | null = null

export const configureUi = (config: UiConfig): void => {
  current = config
}

export const uiConfig = (): UiConfig => {
  if (!current) throw new Error('configureUi() must run before any UI is created.')
  return current
}

export const markUi: UiMarker['mark'] = (element) => uiConfig().marker.mark(element)
