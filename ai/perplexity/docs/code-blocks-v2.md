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
- Line numbers appear when wrapping is off.
- Fold is available for sufficiently long blocks, but code starts expanded.
- Download saves the original source text.

Syntax highlighting is retained only when its reconstructed text matches the source. Otherwise the block falls back to plain text rather than corrupting code.

## Guided tour

Open Help and select Code blocks. The tour highlights the block and its toolbar.

## Verification

Copy a selection containing blank lines, tabs and nested indentation into a plain-text editor. Verify the result before using copied code in a project.
