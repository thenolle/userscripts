---
title: Build and release
description: How headers, bundling and dist output work.
section: Guides
order: 30
---

# Build and release

`buildUserscript` bundles `src/main.ts` to a single IIFE, prepends the header from `createHeader`, and writes `dist/<slug>.user.js` and `dist/<slug>.meta.js`. `__VERSION__` is replaced with the package version.

Run `bun run dev` for unminified watch builds and `bun run build` for a minified release build.

Each script's `src/repo.ts` should call `repoUrls` so update and install URLs stay consistent.
