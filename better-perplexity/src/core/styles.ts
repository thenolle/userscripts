import { injectStyle as inject } from '@nolly/core'

export const injectStyle = (id: string, css: string): void => {
  inject(id, css)
}
