# Changelog

## [1.1.0] - 2026-11-10

### Added

- **Tutorial:** guided tours for every feature, started from the “?” button in the header.

### Fixed

- **Header buttons:** the settings, usage, download and help buttons now sit after ChatGPT's own buttons in the same row, with the same size and hover as the native ones.
- **Export:** finds the messages in the current ChatGPT layout and converts the new answer format (lists, tables, source chips, bold text) to Markdown.

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
