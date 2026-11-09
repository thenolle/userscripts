---
title: API reference
description: Every export of the core package.
section: Reference
order: 20
---

# API reference

## Runtime

- `new Userscript(options)` creates the runtime. Options: `id`, `name`, `version`, `isReady`, `observe`, `initializationDelay`, `safetyInterval`, `clearConsole`, `storage`, `ui`, `openSettings`.
- `register(factory)` adds a feature. `start()` boots the runtime.
- `events.on('ready' | 'navigate', listener)` subscribes to lifecycle events.

## Feature

- `run()` is called on every DOM update.
- `onEnable()` and `onDisable()` are called on transitions.
- `scope` releases listeners and timers when the feature is disabled.
- `menuEntries()` and `commands()` feed the userscript menu and any command palette.

## Utilities

- `ScriptStorage` and `createStorage`: `get`, `set`, `remove`, `subscribe`, `bucket`.
- `createLogger(name)`: `banner`, `info`, `success`, `warning`, `error`, `errorOnce`.
- DOM: `getElement` (XPath), `query`, `queryAll`, `createElement`, `h`, `createUiMarker`.
- Async: `sleep`, `waitFor`, `isAbort`.
- Network: `request`, `getText`, `getJson`.
- Page: `getPageWindow`, `FetchSpy`.
- Misc: `injectStyle`, `removeStyle`, `MenuController`, `Scope`, `Emitter`, `repoUrls`.

## Build

From `@nolly/core/build`: `createHeader(meta)`, `buildUserscript(options)`, `fileNames(slug)`.
