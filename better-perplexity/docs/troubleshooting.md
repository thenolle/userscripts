---
title: Troubleshooting
description: Fixes for missing buttons, wrong usage numbers, failed exports and update problems.
section: Reference
order: 800
---

## A button is missing

Perplexity changes its layout often. Check that the module is enabled in the settings dialog, reload, and look for lines starting with `[Better Perplexity]` in the browser console.

## Usage shows free-tier numbers

You are probably signed out in this browser profile or container. Sign in, then press Refresh in the usage dialog and read **Raw API data**.

## My draft disappeared

Drafts are saved per conversation for 30 days and removed only when you send, discard or restore them. If the restore banner never appears, the message box was not detected on that page.

## Export fails

Use Raw JSON, and include the HTTP status when you report it.

## Updates do not arrive

Use **Check for Updates** from the userscript menu. If your manager shows an older version, re-open the Install link.

## Reporting a bug

Use the [bug report form](https://github.com/thenolle/userscripts/issues/new?template=bug_report.yml) with your script version, browser and manager.
