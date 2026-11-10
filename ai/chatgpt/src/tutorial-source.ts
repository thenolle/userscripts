import type { TutorialSource } from '@nolly/ai'
import { ICON_BUTTON_CLASS } from './header-style'
import { placeTool } from './header-tools'
import { TOURS } from './tours'

export const tutorialSource: TutorialSource = {
  tours: TOURS,
  place: (button) => {
    if (button.className !== ICON_BUTTON_CLASS) button.className = ICON_BUTTON_CLASS
    return placeTool(button, 'help')
  }
}
