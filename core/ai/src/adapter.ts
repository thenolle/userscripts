export interface ConversationRef {
  readonly id: string | null
  readonly projectId: string | null
  readonly temporary: boolean
}

export interface ComposerAdapter {
  readonly isOwnUi: (node: Element) => boolean
  readonly locateComposer?: () => HTMLElement | null
  readonly rejectEditable?: (element: HTMLElement) => boolean
  readonly findSendButton?: (editable: HTMLElement) => HTMLElement | null
  readonly findStopButton?: () => HTMLElement | null
  readonly findFileInput?: () => HTMLInputElement | null
  readonly sendWith?: 'enter' | 'button'
}

export interface PlatformAdapter extends ComposerAdapter {
  readonly id: string
  readonly name: string
  readonly conversation: () => ConversationRef
  readonly findHeaderSlot: () => HTMLElement | null
  readonly describePage: () => Record<string, unknown>
}
