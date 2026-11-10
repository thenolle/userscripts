# AI Core

Platform-agnostic building blocks for AI-chat userscripts such as Better Perplexity and Better ChatGPT. It sits on top of `@nolly/core`.

## What you get

- A platform registry: `configureUi` and `configurePlatform` are called once at startup with the site's storage, logger, composer, generation detection, thread rule, prompt library URL, export source and release information.
- Composer and generation kits: find the input, write text, send, attach files, wait for an answer.
- A streaming response observer and an incremental Server-Sent Events parser.
- A UI kit: dialogs, toasts, tooltips, controls, icons, the settings dialog and the composer button.
- Features that need only the registry: Enter as Newline, Draft Guard, Message Splitter, Prompt Library, Command Palette, Message Queue, Recall, Batch Runner, Selection Toolbar, Max Width, Code Block Pro, Exporter and Update Checker.

This is a library. It is bundled into each userscript and is not installed on its own.

## Adding a platform

1. Create `ai/<site>` with `bun scripts/new-userscript.ts <slug> "<Name>" ai`.
2. Write the site's locators and a composer adapter.
3. Call `configureUi` and `configurePlatform`, then register the features you want.
4. Provide an export source if you want the exporter, and a `codeBlockRoot` hook if you want Code Block Pro.
