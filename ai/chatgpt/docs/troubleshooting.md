---
title: Troubleshooting
description: Fixes for missing buttons, empty limits and failed exports.
section: Reference
order: 800
---

# Troubleshooting

Open the browser console on chatgpt.com and run `betterChatgptDump()`. It prints what the script found: the composer, the header, your messages and the current limits. Attach it to any bug report.

- **No header buttons:** the script waits for the page and the message box to finish loading. Wait a few seconds, or check the module is on in settings.
- **Export finds no messages:** ChatGPT changed how it marks messages. The dump shows `page.turns`; if both counts are 0 while messages are on screen, report it.
- **Limits are empty:** send a message or reload the page.
- **Update check failed (404):** the first release has not been published yet.
