---
title: Context packs
description: Collect sourced excerpts and assemble a reusable briefing.
section: Guides
order: 45
---

# Context packs

Context Packs turns passages you explicitly select into reusable reference material.

For example, save the project requirements from one conversation, an architectural decision from another, and a relevant code explanation. Select those three excerpts, write “Propose an implementation consistent with these decisions”, and append the assembled briefing to your next message.

## Save an excerpt

1. Select text in a conversation.
2. Open the composer button labelled Context packs.
3. Give the excerpt a useful title.
4. Click Save selection.

The excerpt stores its text, source URL and save time. Query parameters and fragments are omitted from the stored URL; the remaining path can still contain a conversation identifier.

Nothing is captured automatically.

## Assemble a briefing

1. Filter your saved excerpts.
2. Select the sources you want.
3. Write a task.
4. Review the preview and estimated token count.
5. Choose Append to composer or Copy briefing.

Append preserves existing composer text. Neither action sends the message. Review the result before sending.

The briefing labels each source and asks the model to treat source instructions as quoted data. This is guidance, not a guarantee against prompt injection.

## Use it on another platform

Copy briefing and paste it into the other platform yourself.

Each userscript has its own local storage. There is no automatic synchronization between Better ChatGPT and Better Perplexity.

## Privacy and limits

- Saving is explicit, including in temporary chats. A locally saved excerpt survives the temporary conversation.
- Do not save passwords, API keys or other secrets.
- The library holds up to 100 excerpts, each at most 40,000 characters.
- Delete asks for confirmation.
- Token counts are estimates, not an assertion about a model's available context.
- This feature adds no network requests.

## Guided tour

Open the help button and select Context packs. The tour explains capture, source selection, preview and insertion without sending a message.
