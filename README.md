# Userscripts

Small, focused userscripts by [Nolly](https://github.com/thenolle). Each script lives in its own folder with its own source, changelog and version.

| Script                                 | What it does                                                                                     | Install                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [Better Perplexity](better-perplexity) | Layout, code blocks, prompt library, batch runs, exports, usage tracking and more for Perplexity | [Install](https://raw.githubusercontent.com/thenolle/userscripts/dist/better-perplexity/better-perplexity.user.js) |

## Installing a script

1. Install a userscript manager: [Violentmonkey](https://violentmonkey.github.io/), [Tampermonkey](https://www.tampermonkey.net/) or Greasemonkey.
2. Click the script's **Install** link above. Your manager shows an install screen.
3. Updates arrive automatically from this repository, and scripts that support it also check for updates themselves.

## How this repository works

- One folder per userscript, each a self-contained TypeScript project built with [Bun](https://bun.sh).
- Bumping `version` in a script's `package.json` and adding a matching `CHANGELOG.md` section on `master` publishes a new release. The workflow builds, minifies, tags `<folder>-v<version>`, attaches the files to a GitHub Release and updates the `dist` branch that userscript managers read.
- Pull requests run type checks and a build for every script.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup and the release checklist.

## License

[PolyForm Strict License 1.0.0](LICENSE). In short: free for noncommercial use, with no distribution and no modified versions. Read the license for the exact terms.

## Support

Bugs and ideas go in [Issues](https://github.com/thenolle/userscripts/issues). See [SUPPORT.md](SUPPORT.md). You can also [sponsor the work](https://github.com/sponsors/thenolle).