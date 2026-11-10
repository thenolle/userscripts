# Contributing

Thanks for helping. This repository uses the [PolyForm Strict License 1.0.0](LICENSE), so please read the licensing note before opening a pull request.

## Licensing of contributions

By submitting a pull request, issue attachment or prompt, you confirm that you wrote it or have the right to share it, and you grant the repository owner a perpetual, worldwide, royalty-free license to use, modify and distribute your contribution as part of these userscripts under any license the owner chooses.

## Ways to contribute

- **Bug reports and ideas:** use the issue forms.
- **Community prompts:** use the "Prompt submission" form, or open a pull request that adds an entry to `ai/perplexity/prompts/library.json`. Both Better Perplexity and Better ChatGPT load that file.
- **Code:** open an issue first for anything larger than a small fix.

## Repository layout

| Folder          | Package                | Purpose                                                                        |
| --------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `core/`         | `@nolly/core`          | Runtime, storage, DOM, HTTP, build tooling                                     |
| `core/ai`       | `@nolly/ai`            | Everything shared by AI-chat userscripts: kits, UI and the features themselves |
| `ai/perplexity` | `@nolly/ai-perplexity` | Better Perplexity                                                              |
| `ai/chatgpt`    | `@nolly/ai-chatgpt`    | Better ChatGPT                                                                 |

Each script declares its release slug in `package.json` under `userscript.slug`. The slug names its tags (`<slug>-v<version>`) and its folder on the `dist` branch.

## How a site plugs in

A site folder contains only what is specific to that site: locators, network observers, the export source, tours and a small amount of glue. At startup it calls `configureUi` and `configurePlatform` from `@nolly/ai` with its storage, logger, composer, generation detection, thread rule, prompt library URL, export source, tutorial, release information and optional hooks. Then it registers the features it wants. See [`core/ai/README.md`](core/ai/README.md).

## Development setup

```bash
bun install        # at the repository root (Bun workspace)
cd ai/chatgpt      # or ai/perplexity
bun run dev        # unminified, rebuilds on change
bun run typecheck
bun run validate:prompts   # Better Perplexity only
bun run build      # minified output in dist/
```

Install the file in `dist/` in your userscript manager to test. Start a new site with `bun scripts/new-userscript.ts <slug> "<Name>" [parent-folder]`, for example `bun scripts/new-userscript.ts better-claude "Better Claude" ai`.

## Code style

- TypeScript, no semicolons, single quotes, no inline comments, TSDoc on public APIs.
- One folder per feature under `core/ai/src/features`, extending `Feature` from `@nolly/core`.
- Site code must not duplicate shared code: if two sites need it, it belongs in `core/ai`.
- No runtime dependencies.

## Releasing

1. Bump `version` in the script's `package.json`.
2. Add a section to its `CHANGELOG.md` in the form `## [x.y.z] - YYYY-MM-DD`.
3. Open a pull request. CI typechecks and builds every package.
4. Merge to `master`. The release workflow tags `<slug>-vX.Y.Z`, creates the release and updates the `dist` branch. Merging without a version bump releases nothing.

## Prompt rules

- Useful to many people, not tied to one person or company.
- No personal data, secrets or copyrighted text.
- Blanks use `{{name}}`; built-ins are `{{clipboard}}`, `{{selection}}`, `{{date}}`, `{{time}}`, `{{url}}` and `{{title}}`.
- `id` is a unique lowercase slug. Run `bun run validate:prompts` in `ai/perplexity` before committing.

## Dated changelogs

Every change belongs to a numbered, dated release section. Do not create pending-release sections. New features require a tutorial and a guide for each supported platform. Update PDF documentation whenever the save workflow changes.
