import type { ExportSource } from '@nolly/ai'
import { parseConversation } from './adapter'
import { toMarkdown } from './dom-markdown'
import { headerTools } from './header-tools'
import { findTurns } from './messages'
import type { Turn } from './messages'

const ROLE_LABEL = { user: 'You', assistant: 'ChatGPT' } as const

const turns = (): Turn[] => {
  const found = findTurns()
  if (!found.length) throw new Error('No messages found on this page.')
  return found
}

const render = (turn: Turn): string => (turn.role === 'user' ? turn.text() : toMarkdown(turn.element))

export const exportSource: ExportSource = {
  name: 'ChatGPT',
  citations: false,
  slug: () => parseConversation(new URL(location.href)).id,
  markdown: async () => turns().map((turn) => `**${ROLE_LABEL[turn.role]}**\n\n${render(turn)}`).join('\n\n---\n\n'),
  json: async () =>
    JSON.stringify(
      {
        app: 'better-chatgpt',
        conversationId: parseConversation(new URL(location.href)).id,
        title: document.title,
        url: location.href,
        exportedAt: new Date().toISOString(),
        messages: turns().map((turn) => ({ role: turn.role, markdown: render(turn) }))
      },
      null,
      2
    ),
  place: (button) => {
    const tools = headerTools()
    if (!tools) return false
    if (button.parentElement !== tools) tools.append(button)
    return true
  }
}
