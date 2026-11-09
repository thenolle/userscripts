export const ROOT = '/html/body/div[1]/div/div/div/div/main/div[2]/div[1]'
export const CONTENT = `${ROOT}/div/div[2]/div/div`

const HEADER_ROW = `${ROOT}/div/div[1]/div[2]/div[1]`
const COMPOSER_ROW = `${CONTENT}[4]/div/div[3]/div/div[2]/div/div/div[2]/div/div[1]/div/div[2]/div[2]`
const MODE_BAR = `${COMPOSER_ROW}/div[2]/div`

export const COMPOSER_ACTIONS = {
  first: `${COMPOSER_ROW}/div[3]/button[1]`,
  next: `${COMPOSER_ROW}/div[3]/div`
} as const

export interface ModeItemSelector {
  readonly id: string
  readonly button: string
  readonly label: string
}

export const HEADER = {
  avatar: `${HEADER_ROW}/div[1]/div/div`,
  previous: `${HEADER_ROW}/div[1]`,
  next: `${HEADER_ROW}/div[2]`
} as const

export const MODE_ITEMS: readonly ModeItemSelector[] = [
  { id: 'search', button: `${MODE_BAR}/span[1]/span/button`, label: `${MODE_BAR}/span[1]/span/button/span[1]/span[2]` },
  { id: 'computer', button: `${MODE_BAR}/span[2]/span/span/button`, label: `${MODE_BAR}/span[2]/span/span/button/span[1]/span[2]` }
]
