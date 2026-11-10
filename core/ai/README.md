# AI Core

Platform-agnostic building blocks for AI-chat userscripts such as Better Perplexity and Better ChatGPT. It sits on top of `@nolly/core`.

## What you get

- **A platform registry.** `configureUi` and `configurePlatform` are called once at startup with the site's storage, logger, composer, generation detection, thread rule, prompt library URL, export source, tutorial, release information and optional hooks (editable filter, custom send, splitter defaults, upload guard, scroller, code block root).
- **Kits.** Composer (find, write, send, attach) and generation (detect, wait for the answer), plus a prompt sender built on them.
- **Network helpers.** A streaming response observer and an incremental Server-Sent Events parser.
- **A UI kit.** Dialogs, toasts, tooltips, controls, icons, the settings dialog and the composer button.
- **Features** that need only the registry: Enter as Newline, Draft Guard, Message Splitter, Prompt Library, Command Palette, Message Queue, Recall, Batch Runner, Selection Toolbar, Max Width, Code Block Pro, Context Packs, Exporter, Update Checker and Tutorial.

This is a library. It is bundled into each userscript and is not installed on its own.

New shared features must include a walkthrough in each platform's tutorial list and a guide in each platform's docs folder.

## Adding a site

1. Create the folder with `bun scripts/new-userscript.ts <slug> "<Name>" ai`.
2. Write the site's locators and a composer adapter.
3. Call `configureUi` and `configurePlatform`, then register the features you want.
4. Provide an export source for the exporter, tours for the tutorial, and a `codeBlockRoot` for Code Block Pro if you want them.
