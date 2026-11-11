---
title: Send when ready
description: Write now and send later, or when quota returns.
section: Guides
order: 47
---

# Send when ready

Click the clock icon in the composer.

## Schedule a message

1. Write your message.
2. Choose a time, or choose a counter that is empty right now.
3. Click Schedule. The composer is cleared and the message is held.

A time trigger sends at that time. A counter trigger sends after the quota tracker sees a real increase in that counter.

## Safety

- You get a 10-second countdown with Send now and Keep waiting.
- Up to 5 messages can wait.
- A message only sends in the conversation where you scheduled it. Elsewhere you get a prompt to open it.
- A time trigger more than 30 minutes overdue asks before sending.
- If sending fails, the text is put back in the composer.

## Limits

The tab must stay open, because a userscript cannot run when the browser is closed. ChatGPT updates its counters only on page load and after sends, so use a time trigger there.

Held messages are stored locally in this userscript's storage. Do not schedule secrets.
