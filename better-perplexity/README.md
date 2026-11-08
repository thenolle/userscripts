# Better Perplexity

A modular userscript that adds the missing parts of the Perplexity web app: reliable usage tracking, better code blocks, long-message handling, a prompt library, batch runs and real exports.

[**Install**](https://raw.githubusercontent.com/thenolle/userscripts/dist/better-perplexity/better-perplexity.user.js) · [Changelog](CHANGELOG.md) · [Report a bug](https://github.com/thenolle/userscripts/issues/new?template=bug_report.yml)

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/).
2. Open the **Install** link above and confirm.
3. Open perplexity.ai. Click the **?** button in the header for an interactive tour.

Updates arrive automatically. The script also checks on its own and offers to update.

## Features

| Feature           | What you get                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Usage status      | Remaining queries per mode in the header, hover summary, details dialog, learned refill estimates    |
| Code Block Pro    | Language badges, syntax colours, line numbers, wrap, fold, download, indentation-safe selection copy |
| Big messages      | Paste any amount of text; split into parts or attach as a file only when needed                      |
| Prompt library    | Your prompts plus community prompts, with a form for placeholders                                    |
| Batch Runner      | Run one template over a list, with pause, resume and reload recovery                                 |
| Selection toolbar | Ask, explain, summarize, fact-check or quote highlighted text                                        |
| Exporter          | Markdown, text, Word and PDF, with citation styles                                                   |
| Draft Guard       | Drafts survive reloads; size meter; warning before closing with unsent text                          |
| Command palette   | Search every action                                                                                  |
| Enter as Newline  | Enter adds a line, a shortcut sends                                                                  |
| Max Width         | Full-width layout, optional sidebar removal                                                          |

## Shortcuts

| Action                  | Default                                    |
| ----------------------- | ------------------------------------------ |
| Command palette         | Alt + Shift + P                            |
| Prompt library          | Alt + Shift + L                            |
| Send message            | Ctrl + Enter or Cmd + Enter (configurable) |
| Send a selection action | Shift-click the action                     |

Change the palette, prompt and send shortcuts from the userscript menu or the settings dialog.

## Community prompts

Prompts are loaded from [`prompts/library.json`](prompts/library.json) and cached for 24 hours. Suggest one with the [prompt form](https://github.com/thenolle/userscripts/issues/new?template=prompt_submission.yml) or a pull request.

## Privacy

No analytics and no server of its own. The script talks to Perplexity from your own session, and to `raw.githubusercontent.com` for update checks and community prompts. Drafts, prompts and settings stay in your userscript manager's storage.

## Troubleshooting

- **A button is missing:** Perplexity changes its layout often. Open the settings dialog to check the module is on, then file a bug with the console output.
- **Usage shows free-tier numbers:** make sure you are signed in on the same browser profile; open “Raw API data” in the usage dialog and attach it to a bug report.
- **Export fails with an HTTP error:** the export relies on Perplexity's own export endpoint. Choose “Raw thread JSON” as a fallback and report it.

## Development

```bash
bun install
bun run dev          # unminified, rebuilds on change
bun run typecheck
bun run build        # minified userscript in dist/
```

See [CONTRIBUTING.md](../CONTRIBUTING.md).

## License

[PolyForm Strict License 1.0.0](../LICENSE).
