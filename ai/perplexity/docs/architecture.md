---
title: Architecture
description: How Better Perplexity is built on the shared @nolly/core package.
section: Reference
order: 700
---

# Architecture

Better Perplexity is a thin layer on top of `@nolly/core`, a small library shared by all userscripts in this repository. The core is bundled into the final `.user.js` file, so you never install it separately.

## What the core provides

- **Runtime:** `Userscript` watches the page, waits for the interface to settle, and calls each feature on every change. `App` in `src/core/app.ts` configures it for Perplexity.
- **Features:** every module extends the core `Feature` class. Disabling a feature releases its listeners and timers automatically.
- **Utilities:** storage, logging, DOM helpers, waiting, HTTP, userscript-manager menus, style injection and the page `fetch` observer.
- **Build:** the metadata header and the bundle are produced by `@nolly/core/build`.

## What comes from @nolly/ai

`@nolly/ai` holds the code Better Perplexity shares with the other AI-chat scripts: composer reading and writing, synthetic keys, generation detection and the response observer. Each piece takes a small adapter, so Perplexity supplies only its own selectors. The dialogs, toasts, tooltips, controls, icons and settings dialog also live there; Better Perplexity configures them once in `main.ts`. Features that need storage, logging or the composer read them from a registry the platform fills once at startup.

## What stays in Better Perplexity

- **Modules:** one folder per feature under `src/modules`.
- **Perplexity logic:** selectors, placeholders and the usage tracker.
- **Instances:** the logger name, the storage key mapping, the UI marker `data-bp-root`, the bindings of the shared kits, and the extraction of the account header from page requests.

## Compatibility

Settings and drafts use the same storage keys as version 1.0.0, so nothing is lost when you update.

## Building from source

The repository is a Bun workspace. Run `bun install` at the root, then `bun run build` in `ai/perplexity`. The build fails if the `core/` or `core/ai/` folders are missing.
