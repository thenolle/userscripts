---
title: Beautiful PDF reports
description: Export readable, selectable reports with contents, sections, code and tables.
section: Guides
order: 55
---

# Beautiful PDF reports

PDF export opens a report preview in a new tab. It no longer downloads a PDF directly.

## Save a report

1. Open a conversation and choose the exporter.
2. Select PDF report.
3. Click Open PDF preview.
4. In the preview, choose Print / Save as PDF.
5. Select Save as PDF in your browser.
6. Enable background graphics for colors.
7. Enable browser headers and footers if you want page numbers.

If the preview is blocked, allow popups for the platform and retry.

## Report layout

The report includes a title page, source URL, UTC export timestamp and a linked table of contents when headings exist.

Body content uses selectable text, a clear heading hierarchy, paragraph spacing, nested lists, blue source links, shaded code panels and alternating table rows. Table headers repeat where the print engine supports them.

No remote fonts, images or rendering services are requested by this report renderer.

## For AI reading

Keep the Markdown or JSON export alongside the PDF. These formats avoid PDF reading-order ambiguity.

The PDF is not a screenshot, but tagging, link preservation, font coverage and extraction behavior depend on the browser and installed fonts. PDF/UA conformance is not claimed.

## Limitations

The report starts from the exporter's parsed Markdown. It does not reconstruct missing source content, render LaTeX, embed conversation images, or preserve every interactive component.

Very wide tables, unusually tall rows and long code blocks should be checked in print preview. Color output depends on browser print settings.

For ChatGPT, the source remains the conversation content currently loaded on the page. This update does not add an authenticated conversation API fetch.

## Guided tour

Open Help and choose PDF reports. The tour explains the preview and browser save settings.
