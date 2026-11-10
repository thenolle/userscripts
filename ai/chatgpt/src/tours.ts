import { createPdfTour } from '@nolly/ai'
import { contextPacksTour, loadPromptShortcut, loadShortcut, tour } from '@nolly/ai'
import type { Tour } from '@nolly/ai'
import { composerKit } from './kit'

const { click, closed, escape, find, info, inside, point, press, wait } = tour

const dialog = (name: string): string => `better-chatgpt-${name}`
const tool = (name: string) => find(`[data-bc-tool="${name}"]`)

const gettingStarted: Tour = {
  id: 'start',
  title: 'Getting started',
  summary: 'The header buttons and where everything lives.',
  steps: [
    info('Welcome to Better ChatGPT', 'This tour shows where everything is. You can exit any time and restart it from the “?” button in the header.'),
    point('Settings', 'Turn modules on or off and open each module’s own settings.', tool('settings')),
    point('Usage', 'Shows what you have left of the limit you chose. Hover for every limit and when it resets, click for details.', tool('usage')),
    point('Export', 'Appears inside a conversation. Exports it as Markdown, Word, PDF, plain text or JSON.', tool('export')),
    point('Message box buttons', 'These buttons sit next to the message box. This one configures how Enter works: Enter adds a new line and a shortcut sends.', find('.bp-config-button')),
    point('Big messages', 'Paste very long text here. It is only split when it is too big for one message.', find('.bp-cb-big')),
    point('Prompt library', 'Insert saved and community prompts. The shortcut works from anywhere.', find('.bp-cb-prompts')),
    point('Batch runner', 'Send the same kind of message for a whole list of items.', find('.bp-cb-batch')),
    press('Command palette', 'Every action in Better ChatGPT is searchable. Try opening it now.', () => loadShortcut()),
    press('Close it again', 'Press Escape to close the palette.', escape),
    info('That’s it', 'Open “?” any time to run a focused tour on one feature.')
  ]
}

const usage: Tour = {
  id: 'usage',
  title: 'Usage and limits',
  summary: 'What you have left, and when it comes back.',
  steps: [
    point('The usage pill', 'It shows the limit you picked. It turns yellow when only a couple are left and red at zero.', tool('usage')),
    click('Open the details', 'Click it to see every limit with its reset time, your plan and the rolling window.', tool('usage')),
    wait('Close the dialog', 'Use Close when you are done.', closed(dialog('usage-dialog'))),
    info('Choose what it shows', 'Open Settings, then Usage Status, then “Badge Shows” to switch the pill to another limit.')
  ]
}

const longMessages: Tour = {
  id: 'long',
  title: 'Writing long messages',
  summary: 'The size meter, big-message box and automatic splitting.',
  steps: [
    point('The message box', 'While you type, a small chip above it shows characters and estimated tokens against the limit.', () => composerKit.findComposer()),
    point('Size meter', 'It turns yellow near the limit and red above it, with a Split button. It only appears once there is text in the box.', find('.bp-draft-meter')),
    click('Open the big message box', 'Click to open it. You can paste any amount of text.', find('.bp-cb-big')),
    point('Paste here', 'Paste or write the message. The line under it says whether it fits in one message.', inside(dialog('bigtext-dialog'), 'textarea')),
    point('Too big?', 'If it is too big, you get a preview of the parts and a choice: send them in order, or attach as a file.', inside(dialog('bigtext-dialog'), '.bp-split-summary')),
    wait('Close the box', 'Use Cancel when you are done.', closed(dialog('bigtext-dialog')))
  ]
}

const prompts: Tour = {
  id: 'prompts',
  title: 'Prompts and placeholders',
  summary: 'Saved prompts, community prompts and the fill-in form.',
  steps: [
    click('Open the prompt library', 'Click the book button, or use the shortcut.', find('.bp-cb-prompts')),
    point('Search', 'Type to search your prompts and community prompts from GitHub. Enter inserts the highlighted one.', inside(dialog('prompt-picker'), '.bp-palette-input')),
    point('Community prompts', 'Prompts marked “Community” come from the shared library. Press Save to copy one into your own list.', inside(dialog('prompt-picker'), '.bp-palette-list')),
    info('Placeholders', 'Prompts can contain blanks like {{topic}} or {{item}}. When you insert one, a form asks what to put in each blank.'),
    press('Close the picker', 'Press Escape to close it.', escape),
    press('The shortcut', 'You can also open the library without the mouse.', () => loadPromptShortcut()),
    press('Close again', 'Press Escape.', escape)
  ]
}

const batch: Tour = {
  id: 'batch',
  title: 'Batch Runner',
  summary: 'Send one message per list item, automatically.',
  steps: [
    info('What it does', 'Imagine researching ten companies. Instead of ten copy-pastes, you write the message once and paste the list.'),
    click('Open the Batch Runner', 'Click the layers button.', find('.bp-cb-batch')),
    point('Step 1: the message', 'Write it once and put {{item}} where each list entry goes. The example buttons fill everything in for you.', inside(dialog('batch-dialog'), '[data-tour="batch-template"]')),
    point('Step 2: the list', 'One entry per line. Each line becomes one message.', inside(dialog('batch-dialog'), '[data-tour="batch-items"]')),
    point('Step 3: review', 'The first messages are previewed before anything is sent, so you confirm before starting.', inside(dialog('batch-dialog'), '[data-tour="batch-review"]')),
    info('While it runs', 'A card appears in the corner with Pause and Cancel. If you reload the page, it offers to resume.'),
    wait('Close the dialog', 'Use Cancel to leave without starting.', closed(dialog('batch-dialog')))
  ]
}

const codeBlocks: Tour = {
  id: 'code',
  title: 'Code blocks',
  summary: 'Language badges, folding, wrapping and copying.',
  steps: [
    point('Enhanced code', 'When an answer finishes, its code blocks are replaced with these. Ask for some code if you do not see one.', find('.bp-code')),
    point('Toolbar', 'Wrap long lines, toggle line numbers, fold long code, copy, or download as a file.', find('.bp-code-actions')),
    info('Selecting and copying', 'You can select part of a block and copy it. Indentation and line breaks are kept exactly.')
  ]
}

const exporting: Tour = {
  id: 'export',
  title: 'Exporting a conversation',
  summary: 'Markdown, Word, PDF, plain text and JSON.',
  steps: [
    click('Open the exporter', 'Click the download button inside a conversation.', tool('export')),
    point('Pick a format', 'Markdown, plain text, Word and PDF are generated right here. JSON lists each message with its role.', inside(dialog('export-dialog'), '.bp-stack')),
    wait('Close the dialog', 'Use Close when you are done.', closed(dialog('export-dialog')))
  ]
}

const selection: Tour = {
  id: 'selection',
  title: 'Selection toolbar',
  summary: 'Ask about any text you highlight.',
  steps: [
    wait('Select some text', 'Highlight a sentence in any answer.', () => document.querySelector('.bp-sel[data-visible="true"]') !== null, 'Select a few words in an answer.'),
    point('Quick actions', 'Ask, Explain, Summarize, Fact-check or Quote. Hold Shift while clicking to send immediately.', find('.bp-sel[data-visible="true"]'))
  ]
}

const palette: Tour = {
  id: 'palette',
  title: 'Command palette',
  summary: 'Search and run any action from the keyboard.',
  steps: [
    press('Open it', 'Use your command palette shortcut.', () => loadShortcut()),
    point('Type to search', 'Try “export”, “usage” or “split”. Arrow keys move, Enter runs.', inside(dialog('palette'), '.bp-palette-input')),
    press('Close it', 'Press Escape.', escape)
  ]
}

const contextPacks: Tour = {
  id: 'context-packs',
  title: 'Context packs',
  summary: 'Turn useful excerpts into a source-labelled briefing.',
  get steps() {
    return contextPacksTour().steps
  }
}

export const TOURS: readonly Tour[] = [gettingStarted, usage, longMessages, prompts, batch, codeBlocks, exporting, selection, palette, contextPacks, createPdfTour()]
