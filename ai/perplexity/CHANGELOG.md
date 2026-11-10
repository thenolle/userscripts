# Changelog

All notable changes to Better Perplexity are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

- Internal: composer, synthetic keys and generation detection moved to the shared `@nolly/ai` package. The script moved to `ai/perplexity`; install URLs and storage keys are unchanged.
- Internal: Prompt Library, Command Palette, Message Queue and Recall now come from the shared package.
- Internal: Enter as Newline now comes from the shared package.
- Internal: Draft Guard now comes from the shared package.
- Internal: Message Splitter now comes from the shared package.
- Internal: Code Block Pro now comes from the shared package.
- Internal: Batch Runner, Selection Toolbar and Max Width now come from the shared package.
- Internal: Exporter and Update checker now come from the shared package.
- Internal: Tutorial engine and styles now come from the shared package.
- Internal: one shared settings dialog; Batch Runner uses the shared prompt sender.
- Fixed a remaining registry-refactor reference that prevented typechecking.
- Dialog positioning is explicitly enforced on the modal element.
- Fixed: the batch runner was registered twice.
- Removed zero-evidence and expired refill predictions.
- Scoped reset timestamps to their corresponding counter.
- Distinguished an unknown subscription tier from subscription activity.
- Made pace labels describe observed counter units and withheld short-history depletion estimates.

## [1.0.5-hotfix.1] - 2026-11-09

### Fixed

- Prevented modules from being registered multiple times.

## [1.1.0] - 2026-11-10

### Changed

- **Shared package:** most modules (prompt library, message splitter, drafts, command palette, queue, recall, batch runner, code blocks, selection toolbar, max width, exporter, update checker, tutorial engine) now come from the shared `@nolly/ai` package, which Better ChatGPT also uses. Behavior, shortcuts, settings and stored data are unchanged.
- **Settings:** the script menu and the gear button open the same settings dialog.

### Fixed

- Dialogs are centered even when the page's CSS resets margins.

## [1.0.5] - 2026-11-09

### Added

- **Message Queue:** type ahead while an answer generates. Queue follow-ups with `Alt + Shift + Q`, and they send one by one after the current answer finishes. The queue survives reloads, stays in its thread, and pauses instead of sending into the wrong conversation.
- **Recall:** search everything you sent, reuse it in one key, and walk back through it with `ArrowUp` / `ArrowDown` in an empty box.
- **Usage alerts and pace:** refill, low and used-up alerts (desktop notifications when the tab is in the background and permission is granted), and a daily pace with an estimate of how long a counter lasts.

### Changed

- **Update checker:** checks on load and every five minutes, shares results between tabs, announces each version once, and "Skip this version" silences it until a newer one is published. The menu shows "Update to vX".
- **Shared core:** updates, version comparison, polling and notifications now come from `@nolly/core` 1.0.2.
- **Docs:** added Message Queue and Recall guides, and updated the shortcuts list.

## [1.0.4] - 2026-11-09

### Changed

- **Usage badge:** redesigned as an outline button with a status ring, count, progress meter and mode name, matching the rest of the interface.
- **Placement:** the badge goes next to the profile button or inline in the header row, so it no longer covers other buttons. Pages without a header use a dock that picks the emptiest corner, can be dragged anywhere (position is remembered) and resets with a double-click.

## [1.0.3] - 2026-11-09

### Fixed

- **Home page and Computer mode:** the usage badge, composer buttons, mode detection and Max Width no longer depend on the conversation page layout. The badge falls back to a floating pill when no profile button is found.
- **Mode detection:** reads the selected control in the composer, then the URL (Computer), then the counter that dropped on your last send, and labels the result "(assumed)" when it is a guess.
- **Draft Guard:** no longer discards a draft when an unrelated background request fires.

### Changed

- **Refill forecasts:** rebuilt around interval measurements. Sends are matched to counter drops and kept across reloads, full resets are recognized, and refreshes speed up to every 15 seconds near an expected refill. The forecast now shows a margin (for example "±12m").
- **Polling:** hidden tabs no longer poll, and returning to the tab refreshes immediately.
- **Diagnostics:** new "Copy Page Diagnostics" menu entry for bug reports.

## [1.0.2] - 2026-11-09

### Changed

- **Update checker:** rechecks about hourly while a tab stays open (at most one real check per 12 hours), and stops its timers when the module is disabled.
- **Internals:** all remaining imports now point straight at `@nolly/core`; the compatibility shim files are gone.

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

---

[1.0.0]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.0.0  
[1.0.1]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.0.1  
[1.0.2]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.0.2  
[1.0.3]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.0.3  
[1.0.4]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.0.4  
[1.0.5]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.0.5  
[1.0.5-hotfix.1]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.0.5-hotfix.1
[1.1.0]: https://github.com/thenolle/userscripts/releases/tag/better-perplexity-v1.1.0
