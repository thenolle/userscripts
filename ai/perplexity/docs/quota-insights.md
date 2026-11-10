---
title: Quota insights
description: Capacity evidence, observed recovery and conditional forecasts.
section: Guides
order: 25
---

# Quota insights

Open Settings → Quota Insights → Open Quota Insights, or find it in the command palette.

## What is recorded

The feature stores remaining counts, observation times, explicit API caps and reported reset timestamps. It does not store conversation text.

History is limited to 30 days and 2,000 observations per counter.

## Maximum allowance

An observed peak means capacity is at least that large. A plateau does not prove the maximum.

Full-recovery scenarios require an explicit API cap. A reported reset timestamp alone does not establish the refill amount.

## Recovery calculations

Positive changes are observed net recovery. Additional spending between observations can hide refill.

The engine calculates an observed net recovery rate across comparable intervals. It excludes gaps longer than five minutes and intervals known to be cap-bound.

Rate scenarios require 30 minutes of comparable observations, at least three positive intervals and a recent observation.

## Forecasts

The panel can show conditional +1, +5, full recovery and recovery within a selected number of minutes.

These scenarios assume the observed net recovery rate continues and no additional units are spent. They are not guaranteed refill schedules or calibrated confidence intervals.

Rolling-window recovery and batch resets can behave differently. The existing Perplexity rolling estimator remains separate.

## Privacy and account changes

Saved observations are local to each userscript.

Perplexity uses its existing account/tier namespace. ChatGPT currently partitions by reported plan, not a verified account id. Do not mix accounts in the same userscript storage when evaluating its history.

## Tutorial

The Help menu includes a Quota insights walkthrough explaining observations, lower bounds and projections.
