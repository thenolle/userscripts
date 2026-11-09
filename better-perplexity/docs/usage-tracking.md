---
title: Usage tracking
description: How remaining queries, totals and refill estimates are calculated, and what to do when they look wrong.
section: Guides
order: 20
---

## What the badge shows

The badge reads your account's limits from Perplexity and shows the count for the **mode you have selected** (Search, Research, Labs or Computer). Hover for every limit at once; click for the full dialog with estimates and account details.

## Where the totals come from

1. A cap sent by Perplexity, when the response includes one.
2. A built-in default for Pro Search, Research and Labs.
3. The highest value ever seen on your account. Learned caps are shown with a ≥ sign because they are lower bounds.

## Refill estimates

Perplexity does not publish exact reset times. The script learns them: every drop in a counter is a use, every rise is a refill, and the time between them becomes a measurement. Outliers are rejected, recent measurements count more, and a blend with a sensible prior gives the estimate and a confidence value.

You will see "Learning" until the script has watched one use and one refill. Use **Reset Learned Usage Data** in the menu to start over.

## When the numbers look wrong

| Symptom                                      | Likely cause                      | Fix                                                                            |
| -------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| Everything shows 0 and "Free queries"        | Perplexity answered as signed out | Sign in on the same browser profile, then Refresh                              |
| Plan shows "None reported" while you are Pro | The account was not identified    | Open **Raw API data** in the dialog and check the account source               |
| Wrong mode shown                             | The mode buttons changed          | Report it with the console line that starts with `Mode buttons look identical` |

> [!TIP]
> If automatic detection fails, use **Set Perplexity Account ID** from the menu and paste the `x-pplx-account` request header value from your browser's network tab.
