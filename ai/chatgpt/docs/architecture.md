---
title: Architecture
description: How Better ChatGPT is built on the shared packages.
section: Reference
order: 900
---

# Architecture

Better ChatGPT is a thin layer on top of two shared packages, both bundled into the final `.user.js`.

- **`@nolly/core`** is the runtime: features, storage, logging, DOM helpers and the build.
- **`@nolly/ai`** holds everything that is not specific to one site: the composer, prompt and generation handling, the UI kit and the features themselves. A site fills in a small registry once at startup.

What stays in this folder:

- selectors and the page locators (message box, header, messages);
- the network observer that reads limits, the model in use and when an answer starts and ends;
- the exporter source, which converts the conversation view to Markdown;
- the usage feature and the header placement.

The script starts only after the page has loaded and the message box has rendered, so it never touches the page while ChatGPT is still starting up.
