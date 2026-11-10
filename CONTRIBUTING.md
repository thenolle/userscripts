# Contributing

Thanks for helping. This repository uses the [PolyForm Strict License 1.0.0](LICENSE), so please read the licensing note before opening a pull request.

## Licensing of contributions

By submitting a pull request, issue attachment or prompt, you confirm that you wrote it or have the right to share it, and you grant the repository owner a perpetual, worldwide, royalty-free license to use, modify and distribute your contribution as part of these userscripts under any license the owner chooses.

## Ways to contribute

- **Bug reports and ideas:** use the issue forms.
- **Community prompts:** use the "Prompt submission" form, or open a pull request that adds an entry to `ai/perplexity/prompts/library.json`.
- **Code:** open an issue first for anything larger than a small fix.

## Repository layout

| Folder          | Package                | Purpose                                              |
| --------------- | ---------------------- | ---------------------------------------------------- |
| `core/`         | `@nolly/core`          | Runtime, storage, DOM, HTTP, build tooling           |
| `core/ai`       | `@nolly/ai`            | Platform-agnostic code shared by AI-chat userscripts |
| `ai/perplexity` | `@nolly/ai-perplexity` | Better Perplexity                                    |
| `ai/chatgpt`    | `@nolly/ai-chatgpt`    | Better ChatGPT                                       |

## Development setup

```bash
bun install        # at the repository root (Bun workspace)
cd ai/perplexity   # or ai/chatgpt
bun run dev        # unminified, rebuilds on change
bun run typecheck
bun run validate:prompts
bun run build      # minified output in dist/
```

Install the file in `dist/` in your userscript manager to test. Code that does not depend on one site belongs in `core/ai`; site-specific selectors and modules stay in the script's folder. Start a new script with `bun scripts/new-userscript.ts <slug> "<Name>" [parent-folder]`, for example `bun scripts/new-userscript.ts better-claude "Better Claude" ai`.

## Code style

- TypeScript, no semicolons, single quotes, no inline comments, TSDoc on public APIs.
- One module per folder under `src/modules`, extending `Feature` from `@nolly/core`.
- No runtime dependencies.

## Releasing

1. Bump `version` in the script's `package.json`. Each script also declares its `userscript.slug` there, which names its tag and its folder on the `dist` branch.
2. Add a section to its `CHANGELOG.md` in the form `## [x.y.z] - YYYY-MM-DD`.
3. Merge to `master`. The release workflow does the rest.

## Prompt rules

- Useful to many people, not tied to one person or company.
- No personal data, secrets or copyrighted text.
- Blanks use `{{name}}`; built-ins are `{{clipboard}}`, `{{selection}}`, `{{date}}`, `{{time}}`, `{{url}}` and `{{title}}`.
- `id` is a unique lowercase slug. Run `bun run validate:prompts` before committing.
