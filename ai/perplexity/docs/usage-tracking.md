---
title: Usage tracking
description: How remaining queries, totals and refill estimates are calculated, and what to do when they look wrong.
section: Guides
order: 20
---

## What the badge shows

The badge reads your account's limits from Perplexity and shows the count for the **mode you have selected** (Search, Research, Labs or Computer). Hover for every limit at once; click for the full dialog with estimates and account details.

## Which mode is shown

The script reads the selected mode from the message box. If that fails it uses the page address (Computer), then the counter that dropped when you last sent a message. A guess is labelled **(assumed)**. The tooltip and dialog always list every counter, so the right number is visible either way.

## Refill estimates

Perplexity does not publish exact reset times, so the script measures them. Each time a counter rises, the script knows the refill happened somewhere between two readings. That gives a range for the refill window, and the estimate is the value most measurements agree on. A wrong built-in guess is corrected after the first measurements.

- **Short ranges count more.** Readings taken a few seconds apart weigh far more than a gap of hours while the tab was closed.
- **Sends are matched to drops.** Messages sent just before closing the tab are remembered, so the drop is still timed exactly.
- **Resets are recognized.** If several units come back together on a schedule, the forecast switches to "Full reset in …".
- **Margins are shown.** "Next +1 in 3h 10m ±4m" means the margin is about four minutes. "within" means older uses from before the script was installed may refill earlier.
- **Faster checks near a refill.** While a refill is expected, usage is read every 15 seconds. The tab must be visible.

You will see "Learning" until the script has watched one use and one refill. Use **Reset Learned Usage Data** in the menu to start over.

## Refill estimates

Perplexity does not publish exact reset times. The script learns them: every drop in a counter is a use, every rise is a refill, and the time between them becomes a measurement. Outliers are rejected, recent measurements count more, and a blend with a sensible prior gives the estimate and a confidence value.

You will see "Learning" until the script has watched one use and one refill. Use **Reset Learned Usage Data** in the menu to start over.

## When the numbers look wrong

| Symptom                                      | Likely cause                      | Fix                                                                               |
| -------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| Everything shows 0 and "Free queries"        | Perplexity answered as signed out | Sign in on the same browser profile, then Refresh                                 |
| Plan shows "None reported" while you are Pro | The account was not identified    | Open **Raw API data** in the dialog and check the account source                  |
| Wrong mode shown                             | The mode buttons changed          | Report it with the console line that starts with `Mode buttons look identical`    |
| Badge or buttons missing on a page           | The page layout changed           | Use **Copy Page Diagnostics** from the menu and attach the output to a bug report |

> [!TIP]
> If automatic detection fails, use **Set Perplexity Account ID** from the menu and paste the `x-pplx-account` request header value from your browser's network tab.
