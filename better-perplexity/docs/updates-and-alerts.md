---
title: Updates and alerts
description: How update checks work, how to skip a version, and how refill alerts and pace work.
section: Guides
order: 25
---

# Updates and alerts

## Update checker

The script looks for a new version shortly after the page loads, then every five minutes while the tab is visible. Tabs share their results, so opening several does not multiply requests.

- **Update** opens the install page in your userscript manager.
- **What's new** opens the release notes and keeps the message open.
- **Skip this version** hides that version until a newer one is published.

The menu always has **Check for Updates**. After a skip it also offers **Show Update vX Again**.

## Refill alerts

Alerts fire when a counter that was at zero is available again, when one drops to about 10% of its total, and when one is used up. The last known counts are stored, so a refill that happened while Perplexity was closed is reported the next time you open it.

To get a desktop notification while the tab is in the background, choose **Allow Desktop Notifications** from the menu. While a counter is at zero, the script then checks once a minute even in a hidden tab. Without permission, alerts appear inside Perplexity.

Turn alerts off with **Turn Refill Alerts Off**.

## Pace

After a few uses the tooltip and dialog show how many uses per day you have averaged over the last seven days, and how long the counter would last without any refills. It is a guide, not a promise, because refills keep arriving.
