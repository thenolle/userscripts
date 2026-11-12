# Changelog

## [0.2.5] - 2026-11-12

- Added `resolveCapacity`: API cap, then plan default, then observed peak, so higher plans adapt automatically.
- Added `QuotaLedger.peak()` to read the highest remaining value seen for a counter.

## [0.2.4] - 2026-11-11

- Send When Ready and quota cards: new feature, status levels, forecast engine and card panel.

## [0.2.3] - 2026-11-10

### Code wrapping and Answer Diff update

- Added measured wrapped-line gutters and restored threshold-based automatic folding.
- Rebuilt quota reporting as recovery cards with evidence details.
- Added the bounded local Answer Diff engine, feature and tutorial.

## [0.2.2] - 2026-11-10

- Integrated the quota-ledger panel and summaries into platform usage features.
- Improved composer scoping, bounded layout, code themes and language metadata.

## [0.2.2] - 2026-11-10

- Added the V2 renderer and shared UI changes.

## [0.2.1] - 2026-11-10

- Replaced placeholder matching with a non-backtracking scanner and Set-based field deduplication.
- Fixed language detection for an empty score map.
- Fixed escaped table-cell parsing and added export error logging.

## [0.2.0] - 2026-11-10

### Export and reliability

- PDF export now opens a semantic print preview with Unicode text, section navigation, colors, readable code and tables.

- PDF saving is controlled through the browser print dialog; Markdown and JSON remain available for machine processing.

- Temporary download URLs are released after a delay instead of immediately.

- Added Context Packs and its reusable tutorial.
- Fixed placeholder substitution to ignore inherited object properties.

### Export and reliability

- PDF export now opens a semantic print preview with Unicode text, section navigation, colors, readable code and tables.

- PDF saving is controlled through the browser print dialog; Markdown and JSON remain available for machine processing.

- Temporary download URLs are released after a delay instead of immediately.

## [0.1.0] - 2026-11-10

- Initial release: adapter contract, composer kit, generation kit, response spy and SSE parser.
- Added placeholders, tokens, selection, clipboard, download, prompt sender and the UI kit (moved from Better Perplexity).
- Added Enter as Newline with configurable send shortcuts and file budget in diagnostics.
