import type { Logger, ScriptStorage } from '@nolly/core'
import type { ComposerKit } from './composer'
import type { GenerationKit } from './generation'
import type { PromptSender } from './prompt'

export interface Platform {
  readonly id: string
  readonly storage: ScriptStorage
  readonly logger: Logger
  readonly composer: ComposerKit
  readonly generation: GenerationKit
  readonly sendPrompt: PromptSender
  readonly onSend: (listener: () => void) => () => void
  readonly threadOf: (pathname: string) => string | null
  readonly promptsUrl: string
	readonly codeBlockRoot?: (pre: HTMLElement) => HTMLElement | null
}

let current: Platform | null = null

export const configurePlatform = (platform: Platform): void => {
  current = platform
}

export const platform = (): Platform => {
  if (!current) throw new Error('configurePlatform() must run before platform features are used.')
  return current
}

export const lazy = <T extends object>(create: () => T): T => {
  let instance: T | null = null
  const resolve = (): T => (instance ??= create())
  return new Proxy({} as T, {
    get: (_target, key) => {
      const target = resolve()
      const value: unknown = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
    set: (_target, key, value) => Reflect.set(resolve(), key, value),
    has: (_target, key) => Reflect.has(resolve(), key)
  })
}

export const storage: ScriptStorage = lazy(() => platform().storage)
export const logger: Logger = lazy(() => platform().logger)

export const findComposer: ComposerKit['findComposer'] = () => platform().composer.findComposer()
export const writeComposer: ComposerKit['writeComposer'] = (editable, text) => platform().composer.writeComposer(editable, text)
export const sendComposer: ComposerKit['sendComposer'] = (editable) => platform().composer.sendComposer(editable)
export const editableFrom: ComposerKit['editableFrom'] = (target) => platform().composer.editableFrom(target)
export const attachFile: ComposerKit['attachFile'] = (editable, file) => platform().composer.attachFile(editable, file)
export const isGenerating: GenerationKit['isGenerating'] = () => platform().generation.isGenerating()
export const waitForResponse: GenerationKit['waitForResponse'] = (options) => platform().generation.waitForResponse(options)
export const sendPrompt: PromptSender = (prompt, signal) => platform().sendPrompt(prompt, signal)
