# Contributing

Thanks for helping. This repository uses the [PolyForm Strict License 1.0.0](LICENSE), so please read the licensing note before opening a pull request.

## Licensing of contributions

By submitting a pull request, issue attachment or prompt, you confirm that you wrote it or have the right to share it, and you grant the repository owner a perpetual, worldwide, royalty-free license to use, modify and distribute your contribution as part of these userscripts under any license the owner chooses.

## Ways to contribute

- **Bug reports and ideas:** use the issue forms.
- **Community prompts:** use the "Prompt submission" form, or open a pull request that adds an entry to `better-perplexity/prompts/library.json`.
- **Code:** open an issue first for anything larger than a small fix.

## Development setup

```bash
cd better-perplexity
bun install
bun run dev        # unminified, rebuilds on change
bun run typecheck
bun run validate:prompts
bun run build      # minified output in dist/
```

Install `dist/better-perplexity.user.js` in your userscript manager to test.

## Code style

- TypeScript, no semicolons, single quotes, no inline comments, TSDoc on public APIs.
- One module per folder under `src/modules`, extending `FeatureModule`.
- No runtime dependencies.

## Releasing

1. Bump `version` in the script's `package.json`.
2. Add a section to its `CHANGELOG.md` in the form `## [x.y.z] - YYYY-MM-DD`.
3. Merge to `master`. The release workflow does the rest.

## Prompt rules

- Useful to many people, not tied to one person or company.
- No personal data, secrets or copyrighted text.
- Blanks use `{{name}}`; built-ins are `{{clipboard}}`, `{{selection}}`, `{{date}}`, `{{time}}`, `{{url}}` and `{{title}}`.
- `id` is a unique lowercase slug. Run `bun run validate:prompts` before committing.
