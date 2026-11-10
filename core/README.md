# Userscript Core

Shared runtime, utilities and build tooling for every userscript in this repository. Write features, not plumbing.

## What you get

- A `Userscript` runtime with a feature registry, mutation-driven updates, navigation events and a command registry.
- A `Feature` base class with enable/disable hooks and automatic cleanup.
- Storage, logger, DOM helpers, waiting, HTTP, menu sync, style injection and a page `fetch` observer.
- A build helper that generates the metadata header and bundles the script.

This is a library. It is bundled into each userscript and is not installed on its own.

## Quick start

```sh
bun scripts/new-userscript.ts my-script "My Script"
```

Pass a third argument to create it inside a parent folder, for example `ai`.

Then read [Getting started](getting-started/) and the [API reference](api/).
