---
title: Message queue
description: Queue follow-up messages while an answer is generating and let them send themselves.
section: Guides
order: 26
---

# Message queue

Write your next message while the current answer is still streaming, then press **Alt + Shift + Q** (or the queue button next to the message box). The message leaves the box and joins a small panel at the bottom right. Each queued message is sent after the previous answer finishes.

If nothing is generating and the queue is empty, the shortcut simply sends the message.

## What it protects

- **Your draft:** the queue never writes over text in the message box. It waits until the box is empty.
- **Your thread:** a message only sends in the thread it was queued for. If you open another thread, the queue stops and offers **Send here instead**. Messages queued on a start page follow the new thread that the first one creates.
- **Reloads:** the queue survives a reload and comes back paused, so nothing sends unexpectedly. Press **Resume** when you are ready.

## The panel

Click a message to edit it. Use the arrows to reorder and × to remove. **Pause** holds the queue, **Send next now** skips the wait for the current answer, and **Clear** empties it. If a message cannot be sent twice in a row, the queue stops and shows **Retry**.

## How it sends

The queue waits until the message box is empty, then writes the next message and presses send. It checks the thread after each send, so a message never lands in the wrong conversation. If the page changes while you are typing, the queue pauses instead of guessing.

## Limits

- **One message at a time.** The queue sends them in order, so you always know what is next.
- **No cross-tab sending.** A queue belongs to one tab. If you open the same thread in another tab, it stays paused there.
- **No sending while the tab is hidden.** The queue resumes when you come back, so nothing sends while you are not looking.
- **No automatic retries.** If a send fails twice, the queue stops and waits for you.

## Troubleshooting

| Symptom                            | Likely cause                                                    | Fix                                                                                                       |
| ---------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| The queue button is missing        | The composer layout changed                                     | Open the command palette with `Alt + Shift + P` and run "Queue current message", or use `Alt + Shift + Q` |
| A message stays queued             | The answer is still generating, or the message box is not empty | Wait for the answer, or press **Send next now**                                                           |
| The queue says "wrong thread"      | You opened a different conversation                             | Press **Send here instead** to send it in the current thread                                              |
| The queue is paused after a reload | That is intentional                                             | Press **Resume** when you are ready                                                                       |
