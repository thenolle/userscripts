# Changelog

## [1.2.5] - 2026-11-11

### Added

- Send When Ready: hold a message and send it at a chosen time, or when a quota counter has units again, after a 10-second countdown.
- 25 new library prompts for decisions, debugging, code review, research, writing and planning.

### Changed

- Usage Quota V2 now shows one card per limit with a status label, meter, 24-hour history, and Next +1, +5 and Full estimates.
- Usage status uses green for OK, yellow for Warning and red for Critical or Empty, with a text label and a symbol so colour is never the only cue.
- Estimates use the API reset time first, then observed refill cadence, then average recovery rate, and always show their basis.

### Fixed

- Critical limits in the usage dialog were drawn yellow; they are now red.
- Usage polling speeds up near an expected refill to narrow the timing uncertainty.
- Language guessing no longer contains a no-op expression in its JSON fallback.

## [1.2.4] - 2026-11-10

### Added

- Answer Diff: local line-by-line comparisons, an explicitly saved baseline, copy/download and a guided tutorial.
- Quota recovery cards with +1, +5, full recovery, adjustable horizon and local scenario times when evidence is sufficient.

### Fixed

- Wrapped code retains enabled line numbers and measures each logical line's rendered height.
- Long code blocks automatically fold according to the configured threshold.
- Code-block resize observers are released when enhanced blocks are removed.
- Original inline display styles are restored when code enhancement is disabled.

### Documentation

- Added Answer Diff privacy, persistence, comparison limits and tutorial documentation.
- Updated code wrapping, folding and quota-card instructions.

## [1.2.2] - 2026-11-10

### Changed

- Merged quota observations and recovery scenarios into Usage Quota V2.
- Removed the separate Quota Insights feature registration while preserving stored observations.
- Added GitHub-like light and dark code palettes that follow explicit site themes.
- Expanded language labels, detection signatures and colored typographic badges.
- Scoped composer tools to a single toolbar after native mode controls.
- Bounded full-width content with border-box sizing and a small outer gutter.

### Fixed

- Known positive usage counts with unknown capacity are labelled Reported.
- Usage headers and detailed dialogs use the same quota-ledger summaries.
- Sidebar visibility restores original inline display styles.
- Nested width wrappers no longer accumulate gutters after navigation.

## [1.2.1] - 2026-11-10

### Added

- Quota Insights: persistent counter observations, observed capacity lower bounds, last net increase and conditional recovery scenarios.
- Adjustable recovery horizon, +1 and +5 scenarios, and full-recovery scenarios when the API supplies capacity.
- Shared tutorial and platform documentation.

### Fixed

- Usage totals no longer fall back to configured allowances.
- Forecasts distinguish observed recovery from guaranteed refill mechanics.

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
[1.2.1]: https://github.com/thenolle/userscripts/releases/tag/better-chatgpt-v1.2.1
