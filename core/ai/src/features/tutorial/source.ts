import type { Step } from './engine'

export interface Tour {
  id: string
  title: string
  summary: string
  steps: readonly Step[]
}

export interface TutorialSource {
  readonly tours: readonly Tour[]
  readonly place: (button: HTMLElement) => boolean
}
