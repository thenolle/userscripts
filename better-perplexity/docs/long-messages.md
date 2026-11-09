---
title: Long messages
description: Paste any amount of text, see the size as you type, and split or attach it only when it is too big.
section: Guides
order: 30
---

## The size meter

While you type, a small chip above the message box shows characters and estimated tokens against your limit. It turns yellow near the limit and red above it.

## Big messages

Click the file button next to the message box and paste your text.

- If it fits, you can insert it into the message box or send it.
- If it is too big, you get a preview of the parts and a choice of how to handle it.

## Sending in parts

The text is split on headings, paragraphs and sentences, never inside a code block unless one block is itself too big. Each part gets a short header such as `[Part 2/5]`, and the last part carries your final instruction. The runner waits for each acknowledgement before sending the next.

> [!WARNING]
> Every part you send uses one query. The dialog says how many before you confirm.

## Attaching as a file

The alternative sends nothing as parts: the text is attached as `message.txt` and you add your question. This avoids extra queries but depends on Perplexity's file upload limits.

## Accuracy

Token counts are estimates (about four characters per token for prose, fewer for code), with a safety margin. Change the limit in the dialog if your account behaves differently.
