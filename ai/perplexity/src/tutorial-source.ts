import type { TutorialSource } from '@nolly/ai'
import { TOURS } from './tours'

export const tutorialSource: TutorialSource = {
  tours: TOURS,
  place: (button) => {
    const indicator = document.querySelector<HTMLElement>('.bp-usage-indicator')
    if (!indicator) return false
    const anchor = indicator.querySelector('.bp-export') ?? indicator.querySelector('.bp-gear')
    if (button.parentElement !== indicator || (anchor && button.nextElementSibling !== anchor)) indicator.insertBefore(button, anchor)
    return true
  }
}
