import { Feature, getPageWindow } from '@nolly/core'
import type { FeatureCommand } from '@nolly/core'
import { chatgptAdapter } from '../adapter'
import { fileBudget } from '../budget'
import { exportSource } from '../export-source'
import { toolRow } from '../header-tools'
import { sendPrompt } from '../kit'
import { findHeaderSlot } from '../locate'
import { session } from '../runtime'

const box = (element: Element): { x: number; y: number; w: number; h: number } => {
  const { x, y, width, height } = element.getBoundingClientRect()
  return { x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height) }
}

const brief = (element: Element): Record<string, unknown> => ({
  tag: element.tagName.toLowerCase(),
  tool: element.getAttribute('data-bc-tool') ?? undefined,
  label: element.getAttribute('aria-label') ?? (element.textContent ?? '').trim().slice(0, 24),
  id: element.id || undefined,
  ...box(element)
})

export class DiagnosticsFeature extends Feature {
  readonly id = 'diagnostics'
  readonly name = 'Diagnostics'
  readonly description = 'Adds betterChatgptDump() and betterChatgptSend(text) to the page console.'

  run(): void {}

  override onEnable(): void {
    const page = getPageWindow() as unknown as Record<string, unknown> | null
    if (page) {
      page['betterChatgptDump'] = () => this.dump()
      page['betterChatgptSend'] = (text: string) => sendPrompt(text)
    }
    this.context.logger.info('Diagnostics ready: betterChatgptDump() and betterChatgptSend(text).')
  }

  override commands(): FeatureCommand[] {
    return [{ id: 'diagnostics.dump', title: 'Dump page diagnostics', keywords: 'debug layout selectors session', run: () => this.context.logger.info(this.dump()) }]
  }

  private dump(): string {
    const slot = findHeaderSlot()
    const row = toolRow()
    return JSON.stringify(
      {
        page: chatgptAdapter.describePage(),
        header: {
          slot: slot ? box(slot) : null,
          groups: slot ? [...slot.children].map(brief) : [],
          row: row ? [...row.children].map(brief) : [],
          tools: [...document.querySelectorAll('[data-bc-tool]')].map((tool) => ({ ...brief(tool), connected: tool.isConnected, display: getComputedStyle(tool).display })),
          exportSlug: exportSource.slug()
        },
        session: session.snapshot(),
        fileBudget: fileBudget(session)
      },
      null,
      2
    )
  }
}
