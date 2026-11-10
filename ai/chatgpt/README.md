# Better ChatGPT

A modular userscript that adds the missing parts of ChatGPT: limits at a glance, better code blocks, long-message handling, a prompt library, batch runs and real exports.

[Changelog](CHANGELOG.md) · [Report a bug](https://github.com/thenolle/userscripts/issues/new?template=bug_report.yml)

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/).
2. Open the **Install** link on the project website and confirm.
3. Open chatgpt.com. The settings button sits in the header next to ChatGPT's own buttons.

Updates arrive automatically. The script also checks on its own and offers to update.

## Features

| Feature           | What you get                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Usage Quota V2      | Remaining counts reported by ChatGPT, your plan, and low/empty alerts; totals and reset schedules are not inferred     |
| Code Blocks V2    | Language badges, syntax colours, line numbers, wrap, fold, download, indentation-safe copy                             |
| Message Splitter  | Paste any amount of text; split into parts or attach as a file only when needed                                        |
| Prompt Library    | Your prompts plus community prompts, with a form for placeholders                                                      |
| Batch Runner      | Run one template over a list, with pause, resume and reload recovery                                                   |
| Selection Toolbar | Ask, explain, summarize, fact-check or quote highlighted text                                                          |
| Exporter          | Markdown, text, Word, PDF and JSON                                                                                     |
| Draft Guard       | Drafts survive reloads; size meter; warning before closing with unsent text                                            |
| Command Palette   | Search every action                                                                                                    |
| Enter as Newline  | Enter adds a line, a shortcut sends                                                                                    |
| Message Queue     | Queue follow-ups while an answer generates; they send one by one                                                       |
| Recall            | Search everything you sent and reuse it                                                                                |
| Tutorial          | Guided tours of every feature, started from the “?” button in the header                                               |
| Max Width         | Full-width conversations, optional sidebar removal                                                                     |
| Update Checker    | Checks on load and every few minutes, tells you once per version                                                       |
| Context Packs     | Save sourced excerpts from conversations and assemble a previewable briefing for your next task                        |

## Shortcuts

| Action          | Default                     |
| --------------- | --------------------------- |
| Command palette | Alt + Shift + P             |
| Prompt library  | Alt + Shift + L             |
| Recall          | Alt + Shift + H             |
| Send message    | Ctrl + Enter or Cmd + Enter |

All of them can be changed from the settings dialog.

Usage Quota V2 shows reported remaining counts only; it does not invent totals or reset schedules. The `/wham/usage` endpoint is not displayed as the ordinary chat quota.

## Privacy

No analytics and no server of its own. The script reads ChatGPT's own responses in your session (for limits and the model in use) and talks to `raw.githubusercontent.com` for update checks and community prompts. Drafts, prompts and settings stay in your userscript manager's storage.

Context Packs stores only excerpts you explicitly save, with their source URL and timestamp. Saved excerpts persist locally even if they originated in a temporary chat. Libraries are separate for each userscript; copying a briefing is the manual transfer mechanism.

## Troubleshooting

- **A button is missing:** open the settings dialog and check the module is on. In the browser console, `betterChatgptDump()` prints what the script found on the page; attach it to a bug report.
- **Export says no messages found:** ChatGPT changed its layout. Run `betterChatgptDump()` and attach it.
- **Limits look empty:** they come from ChatGPT's own responses and appear after the page loads or a message is sent.

## Built on the shared packages

Better ChatGPT is built on [`@nolly/core`](../../core/README.md) and [`@nolly/ai`](../../core/ai/README.md). Both are bundled into `better-chatgpt.user.js` at build time. Only what is specific to ChatGPT lives here: selectors, the network observer, limits, the exporter source and the header placement.

## Development

```bash
bun install          # at the repository root
cd ai/chatgpt
bun run dev          # unminified, rebuilds on change
bun run typecheck
bun run build        # minified userscript in dist/
```

## License

[PolyForm Strict License 1.0.0](../../LICENSE).

## PDF reports

PDF export opens a print-ready preview with a contents list, readable sections, code panels and tables. Use Print / Save as PDF in the preview. See [PDF reports](docs/pdf-reports.md) for print settings and machine-reading limitations.

## Usage Quota V2

The header usage dialog combines reported allowances, capacity evidence and observation-based recovery scenarios. See [Usage Quota V2](docs/usage-quota-v2.md).
