# Changelog

All notable changes to Better Perplexity are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-11-09

### Changed

- **Shared core:** the runtime, feature lifecycle, storage, logger, DOM helpers, HTTP, menu, styles and page request observer now come from the shared `@nolly/core` package, which is bundled into the script. Behavior, settings and stored data are unchanged.
- **Build:** the userscript header and bundling use the shared build helper.
- **Docs:** added an Architecture page and updated the development instructions for the Bun workspace.

### Fixed

- Type errors introduced while moving to the shared core.

## [1.0.0] - 2026-11-08

First public release.

### Added

- **Usage status:** header badge with remaining queries for the selected mode, a hover summary, a detailed dialog, learned refill estimates and plan detection.
- **Code Block Pro:** replaces code blocks when an answer finishes, with language badges, built-in syntax colours, line numbers, wrapping, folding, download, and selection copy that keeps indentation.
- **Message splitter and big-message box:** paste any amount of text; it is split into ordered parts or attached as a file only when it is too big.
- **Prompt library:** composer button and shortcut, your own prompts, and community prompts loaded from GitHub. Placeholders such as `{{item}}` are filled through a form.
- **Batch Runner:** guided three-step wizard that sends one templated message per list item, with pause, resume, cancel and reload recovery.
- **Selection toolbar:** ask, explain, summarize, fact-check or quote any selected text.
- **Exporter:** Markdown, plain text, Word and PDF generated in the browser, with selectable citation styles.
- **Draft Guard:** autosaved drafts per conversation, a restore banner, a size meter and an unsent-text warning.
- **Command palette:** searchable actions with a configurable shortcut.
- **Enter as Newline:** Enter inserts a new line, a configurable shortcut sends.
- **Max Width:** full-width layout with optional right-sidebar removal.
- **Interactive tutorial:** guided tours for every feature, started from the “?” button.
- **Updates:** automatic updates through the userscript manager plus an in-script update check.

[1.0.0]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.0.0
[1.0.1]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.0.1
