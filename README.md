# Userscripts website

The documentation site for [thenolle/userscripts](https://github.com/thenolle/userscripts), built with [Gambrel](https://github.com/thenolle/gambrel) as a client-rendered app that is also prerendered for search engines and link previews.

It builds from the Markdown on `master`: each script folder's `README.md`, `docs/*.md`, `CHANGELOG.md` and `prompts/library.json`. Nothing in this branch is content.

```bash
bun run setup        # clone Gambrel into .gambrel and install
bun run dev          # build against ../userscripts and serve on :4173
bun run build        # production build into dist/
```

Pull requests are built and deployed by the `Docs` workflow on `master`.