# AI Core

Platform-agnostic building blocks for AI-chat userscripts such as Better Perplexity and Better ChatGPT. It sits on top of `@nolly/core`.

## What you get

- A `PlatformAdapter` contract that a site implements once.
- Composer kits: find the input, write text, send, attach files; a prompt sender built on them.
- Generation detection and a wait-for-answer helper.
- A streaming response observer and an incremental Server-Sent Events parser.
- Placeholders, token estimates, selection memory, clipboard and file download helpers.
- A UI kit: dialogs, toasts, tooltips, controls, icons, the settings dialog and the composer button. Call `configureUi` once before using it.
- Feature modules that need only an adapter: Enter as Newline and Draft Guard.
