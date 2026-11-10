---
title: Architecture
description: How Better Perplexity is built on the shared packages.
section: Reference
order: 700
---

# Architecture

Better Perplexity is a thin layer on top of two shared packages. Both are bundled into the final `.user.js`, so you never install them separately.

## @nolly/core

The runtime: `Userscript` watches the page, waits for the interface to settle, and calls each feature on every change. Every feature extends the core `Feature` class, and disabling one releases its listeners and timers. It also provides storage, logging, DOM helpers, HTTP, userscript-manager menus, style injection and the build.

## @nolly/ai

Everything that is not specific to Perplexity: the composer and generation kits, the UI kit (dialogs, toasts, tooltips, controls, settings dialog) and the features themselves. A site fills in a small registry once at startup, and features read what they need from it.

## What stays in Better Perplexity

- **Locators:** composer actions, the header, selectors and Max Width rules.
- **Network:** the request observer that tells features when a question is sent, and the thread rule.
- **Usage status:** the header badge, its API client, refill estimator and alerts.
- **Export source:** Perplexity's export endpoint, including citation handling.
- **Tours:** the tutorial steps for Perplexity's interface.
- **Settings button:** the gear next to the usage badge.

## Compatibility

Settings and drafts use the same storage keys as earlier versions, so nothing is lost when you update.

## Building from source

The repository is a Bun workspace. Run `bun install` at the root, then `bun run build` in `ai/perplexity`. The build needs the `core/` and `core/ai/` folders at the repository root.
