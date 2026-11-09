import type { Command, FeatureCommand, ScriptContext } from '@nolly/core'

export { Feature as FeatureModule, type MenuEntry } from '@nolly/core'
export type { Command }
export type ModuleCommand = FeatureCommand
export type AppContext = ScriptContext & { readonly getModules: () => ReturnType<ScriptContext['getFeatures']> }
