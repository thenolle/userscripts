import { uiConfig } from '../../ui/config'
import type { Tour } from '../tutorial/source'
import { click, closed, find, info, point, wait } from '../tutorial/steps'

export const contextPacksTour = (): Tour => {
  const id = `${uiConfig().id}-context-packs`

  return {
    id: 'context-packs',
    title: 'Context packs',
    summary: 'Turn useful excerpts into a source-labelled briefing.',
    steps: [
      info(
        'Keep the useful parts',
        'Select a useful passage in a conversation before opening Context Packs. Saving is always explicit; nothing is collected automatically.'
      ),
      click(
        'Open Context Packs',
        'Click the layers button labelled Context packs.',
        find('.bp-cb-context')
      ),
      point(
        'Save an excerpt',
        'Give the excerpt a useful title. Save selection stores its text and source URL locally. Do not save secrets or sensitive temporary-chat content.',
        find(`#${id} [data-context-capture]`)
      ),
      point(
        'Choose your evidence',
        'Select saved excerpts. Filtering the list does not remove selected sources from the briefing.',
        find(`#${id} [data-context-sources]`)
      ),
      point(
        'Preview before inserting',
        'Write a task and inspect the source-labelled preview. Append preserves your existing draft; Copy lets you transfer the briefing manually to another platform. Neither action sends it.',
        find(`#${id} [data-context-preview]`)
      ),
      wait(
        'Close the dialog',
        'Use Close to finish without inserting anything.',
        closed(id)
      )
    ]
  }
}
