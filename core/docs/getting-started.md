---
title: Getting started
description: Create a userscript on top of the core in a few minutes.
section: Guides
order: 10
---

# Getting started

## Scaffold
```sh
bun scripts/new-userscript.ts my-script "My Script"
bun install
cd my-script
bun run dev
```

Pass a third argument to create it inside a parent folder, for example `ai`. The `cd` command goes to the created folder.

## A feature
```ts
import { Feature } from '@nolly/core'

export class HideBanner extends Feature {
	readonly id = 'hide-banner'
	readonly name = 'Hide banner'
	readonly description = 'Hides the promo banner.'

	run(): void {
		document.querySelector('.promo')?.remove()
	}
}
```

## Wire it up
```ts
import { Userscript } from '@nolly/core'
import { HideBanner } from './features/hide-banner'

new Userscript({ id: 'my-script', name: 'My Script', version: __VERSION__ })
	.register((context) => new HideBanner(context))
	.start()
```

## Cleanup

Everything added to `this.scope` (listeners, timers, teardowns) is released automatically when the user disables the feature.
