# Changelog

## [1.0.4] - 2026-11-12

- Added `isFiniteNumber` and `isPositiveNumber` numeric guards.

## [1.0.3] - 2026-11-10

### Export and reliability

- PDF export now opens a semantic print preview with Unicode text, section navigation, colors, readable code and tables.

- PDF saving is controlled through the browser print dialog; Markdown and JSON remain available for machine processing.

- Temporary download URLs are released after a delay instead of immediately.

- `repoUrls` accepts an optional `dir` for scripts that live in a nested folder.

### Export and reliability

- PDF export now opens a semantic print preview with Unicode text, section navigation, colors, readable code and tables.

- PDF saving is controlled through the browser print dialog; Markdown and JSON remain available for machine processing.

- Temporary download URLs are released after a delay instead of immediately.

## 1.0.2

### Added

- **Updater:** checks a userscript's published metadata on load and on a schedule, shares timestamps between tabs, announces each version once and remembers skipped versions.
- **Utilities:** `compareVersions` / `isNewerVersion`, `Poller`, `retry`, `withTimeout`, `debounce`, `throttle`, `once`, `memoizeFor`, `notify` helpers, `waitForElement`, `observe`, and `Emitter.once`.

## 0.1.1

- `injectStyle` now returns nothing; use the new `removeStyle(id)` to remove a style.

## 0.1.0

- First release: runtime, feature base class, storage, logger, DOM, wait, HTTP, menu, styles, fetch observer and build helper, extracted from Better Perplexity.
