import { Raster, type Color } from '../.gambrel/website/scripts/raster.ts'
import { fonts } from '../.gambrel/website/scripts/social-image.ts'
import { wrapFontText } from '../.gambrel/website/scripts/true-type.ts'

const INK: Color = [24, 24, 27]
const MUTED: Color = [102, 102, 108]
const PAPER: Color = [250, 250, 249]
const CHIP: Color = [236, 236, 232]
const PALETTE: readonly Color[] = [[59, 130, 246], [168, 85, 247], [34, 197, 94], [249, 115, 22], [236, 72, 153], [234, 179, 8]]

export interface Card {
  label: string
  title: string
  description: string
  chips: readonly string[]
  seed: string
}

const hash = (text: string): number => [...text].reduce((value, char) => (Math.imul(value, 31) + char.charCodeAt(0)) >>> 0, 7)

const languageBar = (canvas: Raster, seed: string): void => {
  let state = hash(seed)
  const weights = PALETTE.map(() => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return 1 + (state % 100) / 40
  })
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let x = 0
  PALETTE.forEach((color, index) => {
    const width = index === PALETTE.length - 1 ? 1200 - x : Math.round((weights[index]! / total) * 1200)
    canvas.roundRect(x, 612, width, 18, 0, color)
    x += width
  })
}

export const ogCard = ({ label, title, description, chips, seed }: Card): Buffer => {
  const canvas = new Raster(1200, 630)
  const { regular, bold } = fonts()
  canvas.background(() => PAPER)
  canvas.roundRect(72, 64, 58, 58, 15, INK)
  bold.draw(canvas, 'U', 72 + (58 - bold.measure('U', 34)) / 2, 106, 34, [250, 250, 249])
  regular.draw(canvas, 'thenolle /', 148, 103, 26, MUTED)
  bold.draw(canvas, 'userscripts', 148 + regular.measure('thenolle / ', 26), 103, 26, INK)
  regular.draw(canvas, label, 72, 190, 22, MUTED)
  let size = 68
  let lines = wrapFontText(bold, title, size, 1056, 3)
  if (lines.length === 3) {
    size = 56
    lines = wrapFontText(bold, title, size, 1056, 3)
  }
  lines.forEach((line, index) => bold.draw(canvas, line, 70, 262 + index * (size + 10), size, INK))
  const top = 262 + (lines.length - 1) * (size + 10) + 58
  wrapFontText(regular, description, 27, 1040, 2).forEach((line, index) => regular.draw(canvas, line, 72, top + index * 36, 27, MUTED))
  let x = 72
  for (const chip of chips) {
    const width = regular.measure(chip, 21) + 34
    canvas.roundRect(x, 520, width, 46, 23, CHIP)
    regular.draw(canvas, chip, x + 17, 551, 21, INK)
    x += width + 12
  }
  languageBar(canvas, seed)
  return canvas.png()
}