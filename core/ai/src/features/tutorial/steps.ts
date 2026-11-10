import type { Shortcut } from '../command-palette/shortcut'
import type { Step } from './engine'

export const find = (selector: string) => (): HTMLElement | null => document.querySelector<HTMLElement>(selector)
export const inside = (id: string, selector: string) => find(`#${id} ${selector}`)
export const info = (title: string, body: string): Step => ({ title, body })
export const point = (title: string, body: string, target: () => HTMLElement | null): Step => ({ title, body, target })
export const click = (title: string, body: string, target: () => HTMLElement | null): Step => ({ title, body, target, kind: 'click' })
export const press = (title: string, body: string, shortcut: () => Shortcut): Step => ({ title, body, kind: 'key', shortcut })
export const wait = (title: string, body: string, until: () => boolean, hint?: string): Step => ({ title, body, kind: 'wait', until, hint })
export const escape: () => Shortcut = () => ({ ctrl: false, alt: false, shift: false, meta: false, code: 'Escape' })
export const closed = (id: string) => (): boolean => !document.getElementById(id)
