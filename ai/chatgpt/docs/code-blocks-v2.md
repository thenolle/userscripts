---
title: Code Blocks V2
description: Faithful source selection, syntax colors and a compact code toolbar.
section: Guides
order: 48
---

# Code Blocks V2

Code Blocks V2 keeps a continuous source text flow with actual newline characters.

## Copying

Select code and use Ctrl+C or Cmd+C. Line breaks and selected indentation are preserved. Selecting from the middle of a line copies only the selected portion of that line.

Copy code copies the entire original block. Line numbers are not part of the source.

The feature does not alter ChatGPT's editable Run-code editors.

## Reading

- Wrap toggles visual wrapping without changing the source.
- Line numbers remain available with wrapping and align with logical source lines.
- Long blocks automatically fold at the configured threshold. Expand code reveals the full block; a threshold of zero disables automatic folding.
- Download saves the original source text.

Syntax highlighting is retained only when its reconstructed text matches the source. Otherwise the block falls back to plain text rather than corrupting code.

## Guided tour

Open Help and select Code blocks. The tour highlights the block and its toolbar.

## Verification

Copy a selection containing blank lines, tabs and nested indentation into a plain-text editor. Verify the result before using copied code in a project.

## Themes and language badges

Code panels follow the site's explicit light/dark theme, with a GitHub-like syntax palette. Language badges retain their language-associated colors. Badges are typographic representations, not official logo artwork.

Additional filename labels and conservative content signatures improve detection. New language labels may use an approximate syntax palette or plain text; the original source remains authoritative.

## Wrapping and folding in 1.2.4

Wrapping and line numbers are independent toggles. A wrapped logical line keeps one source line number. The gutter is remeasured when the code viewport resizes.

Long blocks automatically fold according to the configured threshold. A threshold of zero disables this behavior. Copy and download still use the complete source.
