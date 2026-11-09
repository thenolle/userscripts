---
title: Keeping scripts updated
description: Add update checks, skip handling and notifications to any userscript in a few lines.
section: Guides
order: 40
---

# Keeping scripts updated

`Updater` checks the `.meta.js` file your build publishes. It looks shortly after load, then every five minutes while the tab is visible. Tabs share their last-check time, so only one of them fetches. Each version is announced once, and a skipped version stays quiet until a newer one appears.
```ts
import { Updater } from '@nolly/core'

const updater = new Updater({
	metaUrl: URLS.meta,
	current: __VERSION__,
	storage: context.storage,
	onAvailable: ({ version }) => showUpdateBanner(version),
	onChange: () => context.refreshMenu()
})

updater.start(this.scope)
```

Call `updater.check(true)` from a menu entry for a manual check. It ignores skips and always reports the result. Use `updater.skip(version)` for a "Skip this version" button.

## Notifications

`notify(title, { body, onClick })` shows a desktop notification when permission was granted. Call `requestNotifyPermission()` from a click handler to ask for it.
