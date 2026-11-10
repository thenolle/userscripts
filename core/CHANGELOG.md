# Changelog

## [Unreleased]

- `repoUrls` accepts an optional `dir` for scripts that live in a nested folder.

## 1.0.2

### Added

- **Updater:** checks a userscript's published metadata on load and on a schedule, shares timestamps between tabs, announces each version once and remembers skipped versions.
- **Utilities:** `compareVersions` / `isNewerVersion`, `Poller`, `retry`, `withTimeout`, `debounce`, `throttle`, `once`, `memoizeFor`, `notify` helpers, `waitForElement`, `observe`, and `Emitter.once`.

## 0.1.1

- `injectStyle` now returns nothing; use the new `removeStyle(id)` to remove a style.

## 0.1.0

- First release: runtime, feature base class, storage, logger, DOM, wait, HTTP, menu, styles, fetch observer and build helper, extracted from Better Perplexity.
