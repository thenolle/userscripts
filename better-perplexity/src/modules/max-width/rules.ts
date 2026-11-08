import { CONTENT, ROOT } from '../../selectors'

export interface HideRule {
  readonly id: string
  readonly xpath: string
}

export interface LayoutRule {
  readonly xpath: string
  readonly styles: Readonly<Record<string, string>>
}

const FULL = { width: '100%', 'max-width': '100%' } as const

export const RIGHT_SIDEBAR: HideRule = { id: 'right-sidebar', xpath: `${CONTENT}[2]` }

export const ALWAYS_HIDDEN: readonly HideRule[] = [
  { id: 'hide-1', xpath: `${CONTENT}[1]/div/div/div[2]` },
  { id: 'hide-3', xpath: `${CONTENT}[1]/div[2]/div/div/div[1]/div/div[2]/div[2]` },
  { id: 'hide-4', xpath: `${CONTENT}[1]/div[2]/div/div[1]/div[1]/div/div/div[2]` }
]

export const LAYOUT_RULES: readonly LayoutRule[] = [
  { xpath: `${CONTENT}[1]/div[2]/div/div`, styles: FULL },
  { xpath: `${CONTENT}[1]/div[2]/div`, styles: { ...FULL, 'grid-template-columns': '1fr' } },
  { xpath: `${CONTENT}[1]/div[2]/div/div/div[1]/div/div[2]`, styles: FULL },
  { xpath: `${CONTENT}[1]/div[2]/div/div/div[1]/div`, styles: FULL },
  { xpath: `${CONTENT}[3]/div`, styles: FULL },
  { xpath: `${CONTENT}[3]`, styles: { ...FULL, padding: '0', 'clip-path': 'none' } },
  { xpath: `${CONTENT}[4]`, styles: { ...FULL, 'padding-right': 'var(--spacing-4)', 'clip-path': 'none' } },
  { xpath: `${CONTENT}[4]/div`, styles: FULL },
  { xpath: `${ROOT}/div[5]/div`, styles: { ...FULL, 'padding-left': '1rem', 'padding-right': '1rem' } },
  { xpath: `${ROOT}/div[5]/div/div`, styles: { ...FULL, padding: '0' } }
]