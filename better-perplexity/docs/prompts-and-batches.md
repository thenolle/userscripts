---
title: Prompts and batches
description: Reusable prompts with placeholders, community prompts from GitHub, and running one message over a whole list.
section: Guides
order: 40
---

## Prompt library

Open it with the book button next to the message box, or press `Alt + Shift + L`. Search your own prompts and the community's, then press Enter to insert one.

## Placeholders

A prompt can contain blanks written as double braces. Inserting it opens a form that asks what to put in each blank.

| Placeholder            | Filled with                   |
| ---------------------- | ----------------------------- |
| `{{clipboard}}`        | Your clipboard                |
| `{{selection}}`        | The text you selected         |
| `{{date}}`, `{{time}}` | Now                           |
| `{{url}}`, `{{title}}` | The current page              |
| `{{anything_else}}`    | Whatever you type in the form |

Built-ins that come up empty are asked for as well, so you never send a blank.

## Community prompts

The community list is loaded from this repository, cached for 24 hours and merged into the picker. Press **Save** to copy one into your own library.

## Batch Runner

Use it when you would otherwise paste the same kind of message many times. It is a three-step wizard:

1. Write the message once and put `{{item}}` where each list entry goes.
2. Paste your list, one entry per line. Comma- or tab-separated columns are available as `{{1}}`, `{{2}}` and so on.
3. Review the first messages, set a pause, and confirm that each message uses one query.

Messages are sent into the current conversation one after another, waiting for each answer. A card in the corner has Pause and Cancel, progress survives a reload with a Resume offer, and when it finishes you can export the whole conversation.

> [!CAUTION]
> The runner stops at 200 entries and never runs without your confirmation of the query cost.
