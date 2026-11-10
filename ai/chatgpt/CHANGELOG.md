# Changelog

## [1.2.0] - 2026-11-10

### Changed

- Renamed Code Block Pro to Code Blocks V2.
- Rebuilt code selection around actual newline text nodes and source-faithful content.
- Added restrained toolbar styling, explicit folding, and a non-selectable line-number gutter.
- Improved shared dialog spacing and form styling.

### Fixed

- Removed unverified usage totals and misleading quota interpretations.
- ChatGPT header tools explicitly restore pointer interaction and reattach to the visible native row.
- Expired ChatGPT tool counters are labelled as awaiting an update rather than automatically refilled.

## [1.1.2] - 2026-11-10

### Fixed

- Fixed language detection crashing when code has no recognized language signals.
- Replaced the placeholder regular expression with a single-pass delimiter scanner.
- Fixed Markdown table escaping for backslashes and pipes.
- Fixed shared export parsing of escaped table cells.
- Export failures are now logged with their actual error.

## [1.1.1] - 2026-11-10

### Export and reliability

- PDF export now opens a semantic print preview with Unicode text, section navigation, colors, readable code and tables.

- PDF saving is controlled through the browser print dialog; Markdown and JSON remain available for machine processing.

- Temporary download URLs are released after a delay instead of immediately.

- Fixed a remaining registry-refactor reference that prevented typechecking.
- Dialog positioning is explicitly enforced on the modal element.

### Export and reliability

- PDF export now opens a semantic print preview with Unicode text, section navigation, colors, readable code and tables.

- PDF saving is controlled through the browser print dialog; Markdown and JSON remain available for machine processing.

- Temporary download URLs are released after a delay instead of immediately.

### Added

- Context Packs: explicitly save selected excerpts with source URLs, select relevant sources, preview a briefing, and append it to the composer without sending.
- Guided Context Packs tutorial and dedicated documentation.

### Fixed

- Shared placeholder expansion only substitutes explicitly provided values.
- Included the shared dialog positioning and Enter as Newline registry-reference repairs.

### Documentation

- Documented Context Packs privacy, storage limits, manual transfer and temporary-chat persistence.

## [1.1.0] - 2026-11-10

### Added

- **Tutorial:** guided tours for every feature, started from the “?” button in the header.

### Fixed

- **Header buttons:** the settings, usage, download and help buttons now sit after ChatGPT's own buttons in the same row, with the same size and hover as the native ones.
- **Dialogs** are centered even though ChatGPT's stylesheet resets margins.
- **Command palette:** "Scroll to top/bottom" scrolls ChatGPT's conversation container.
- **Export:** finds the messages in the current ChatGPT layout and converts the new answer format (lists, tables, source chips, bold text) to Markdown.
- **Export filenames** use the conversation title and keep accented letters.

## [1.0.0] - 2026-11-10

- Exporter built from the conversation view (Markdown, text, Word, PDF, JSON) and update checker.
- Batch Runner, Selection Toolbar (Ask, Explain, Summarize, Fact-check, Quote) and Max Width.
- Initial skeleton: composer and header detection, response observer, session state and diagnostics.
- Starts only after the page has loaded and the composer has rendered, so it doesn't interfere with ChatGPT's own startup.
- Header settings button and settings dialog from the shared UI kit; `betterChatgptSend(text)` for testing the composer.
- Draft Guard: autosaved drafts, size meter and unsent-text warning.
- Message Splitter: send oversized prompts in parts or attach them as a file (respects remaining uploads).
- Code Block Pro: language badges, highlighting, line numbers, wrap, fold, copy and download.
- Prompt Library (shared community prompts), Command Palette, Message Queue and Recall.
- Usage Status: remaining reasoning, upload, image and research limits with reset times, plan and rolling window, and alerts.

---

[1.0.0]: https://github.com/thenolle/userscripts/releases/tag/better-chatgpt-v1.0.0  
[1.1.0]: https://github.com/thenolle/userscripts/releases/tag/better-chatgpt-v1.1.0
[1.1.1]: https://github.com/thenolle/userscripts/releases/tag/better-chatgpt-v1.1.1
[1.1.2]: https://github.com/thenolle/userscripts/releases/tag/better-chatgpt-v1.1.2
[1.2.0]: https://github.com/thenolle/userscripts/releases/tag/better-chatgpt-v1.2.0
