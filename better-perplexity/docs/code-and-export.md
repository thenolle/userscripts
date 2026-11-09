---
title: Code blocks and export
description: Better code blocks with language badges, and exporting threads as Markdown, Word, PDF or plain text.
section: Guides
order: 50
---

## Code blocks

When an answer finishes, its code blocks are replaced with an improved version:

- A language badge, detected from the label, the filename, the shebang or the code itself.
- Built-in syntax colours, line numbers, wrapping and folding for long code.
- Copy and download buttons. Selecting part of a block and copying keeps the indentation and line breaks exactly.

Configure it from the menu: **Configure Code Block Pro**.

## Exporting a thread

Open a conversation and click the download button in the header.

| Format       | Notes                                                              |
| ------------ | ------------------------------------------------------------------ |
| Markdown     | Cleaned and formatted, with a title and export date                |
| Plain text   | Underlined headings, indented code, links written as `label (url)` |
| Word (.docx) | Real headings, lists, tables, quotes and clickable links           |
| PDF          | Generated in your browser with selectable text and page numbers    |
| Raw JSON     | The thread data, as a fallback                                     |

## Citation styles

Choose how sources appear: parenthesized links, inline links, domain names, a numbered Sources list, Markdown footnotes, or none.

> [!NOTE]
> Exports rely on Perplexity's own export endpoint. If one fails with an HTTP error, use Raw JSON and report it.
