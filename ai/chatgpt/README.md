# Better ChatGPT

A modular userscript for chatgpt.com. It is in early development: version 0.1.0 detects the composer and header and tracks generation, model, plan and limits from the live network stream.

## Install

Install [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/), then open the install link from the project website.

## Diagnostics

Open the browser console on chatgpt.com and run `betterChatgptDump()` to print the detected layout and the live session state.

## Usage

- Figures come from ChatGPT's own responses and update on page load and after each message.

## Built on the shared core

Better ChatGPT is built on [`@nolly/core`](../../core/README.md) and [`@nolly/ai`](../../core/ai/README.md), and is bundled into one file at build time.

## License

[PolyForm Strict License 1.0.0](../../LICENSE).
