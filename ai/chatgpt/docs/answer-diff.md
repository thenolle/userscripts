---
title: Answer diff
description: Compare exact changes between answers or code revisions.
section: Guides
order: 46
---

# Answer diff

Answer Diff compares two pieces of text locally. It does not send messages, call an AI service or judge which answer is correct.

## Compare revisions

1. Select an answer before opening Answer diff, or copy the answer yourself.
2. Open the Answer diff composer tool.
3. Put the original text in Baseline and the revision in Revision.
4. Click Compare.
5. Inspect added, removed and unchanged lines.
6. Copy or download the comparison if useful.

Blank lines and indentation participate in the comparison. Line endings are normalized.

## Reuse a baseline

Save baseline explicitly stores the left editor's text, source URL and save time.

Return from another conversation, paste the revised answer and compare it against that baseline. You can also paste text from the other platform manually.

Each installed userscript has its own storage; there is no automatic synchronization.

Replacing or deleting the saved baseline asks for confirmation. Deleting the saved baseline does not erase text already in the open editors.

## Privacy

Editor text is not saved automatically. Only Save baseline persists content.

Explicitly saved temporary-chat content persists locally. Do not save secrets or sensitive information. Stored source URLs omit query parameters and fragments, but may contain conversation identifiers.

## Limits

Each editor accepts up to 100,000 characters.

The exact line comparison uses a bounded longest-common-subsequence matrix. If the changed region is too large, it is shown as a coarse removal/addition block, clearly labelled.

The downloaded comparison is a readable report, not a patch intended for automatic application.

## Tutorial

Open Help and choose Answer diff.
