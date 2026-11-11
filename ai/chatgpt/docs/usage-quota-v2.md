---
title: Usage Quota V2
description: One card per limit with status, refill estimates and full-recovery time.
section: Guides
order: 25
---

# Usage Quota V2

Click the usage control in the header. Each limit has its own card.

## Status colours

- Green with a check: OK.
- Yellow with an exclamation mark: Warning.
- Red with a cross: Critical or Empty.
- Grey with a question mark: Unknown.

With a reported capacity, a limit is Warning at 40% or less and Critical at 15% or less. Without one, 3 or fewer units is Warning and 1 or fewer is Critical. A count of 0 is Empty.

## Next +1, +5 and Full

Each card shows when the next unit, five units, and a full refill are expected, as a countdown and a clock time with a margin when one is known.

The basis is printed under the times. The sources are used in this order:

1. The reset time reported by the site's API.
2. Your observed refill cadence, when refills have been regular.
3. Your average observed recovery rate.

When none applies, the card says Learning, Stale or Overdue. It never invents a countdown.

## What Full means

If the site reports a capacity, Full means that capacity. Otherwise it means the highest level you have seen, and the card says so.

## Accuracy

These are estimates from this device's observations. Refills can be irregular, spending changes the timing, and activity in other tabs or apps is invisible here. The estimate improves with more time open on the site.

## Account scope

Perplexity history is separated by account and tier. ChatGPT history is separated by reported plan, so avoid mixing ChatGPT accounts in one userscript storage.
