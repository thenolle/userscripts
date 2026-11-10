---
title: Usage Quota V2
description: Reported counts, capacity evidence and recovery scenarios in one usage feature.
section: Guides
order: 25
---

# Usage Quota V2

Click the usage control in the header. The main usage dialog now contains the observation engine previously shown separately as Quota Insights.

## Reported counts and capacity

A known count is labelled Reported even when capacity is unknown.

API-reported capacity is shown separately from the observed maximum. An observed maximum is only a lower bound. It does not prove the account's maximum allowance.

## Recovery calculations

The dialog shows the last observed net increase, comparable sampling time, net recovery, net spending and conditional recovery scenarios.

You can choose a recovery horizon. When sufficient observations exist, the same engine supplies +1, +5, recovery within that horizon and full-recovery scenarios.

Full recovery requires an explicit API capacity. A reset timestamp alone does not establish the refill amount.

## Interpretation

Rate scenarios assume no additional spending and an unchanged observed net recovery rate. They are not guarantees or calibrated confidence intervals.

Long gaps, hidden spending, cap changes and activity in other clients affect the calculation. Unknown results are not replaced with invented countdowns.

## Storage and account scope

Existing quota observations are preserved.

Perplexity reports are requested using its current account/tier namespace. ChatGPT currently partitions by reported plan rather than a verified account id. Avoid mixing ChatGPT accounts in the same userscript storage.

## Tutorial

Open Help and choose Usage Quota V2. There is no separate Quota Insights module to enable.

## Recovery cards

The dialog displays +1, +5 and full-recovery cards. When evidence supports a scenario, each card shows a relative duration and an estimated local clock time. These are conditional rate scenarios, not guaranteed server refill deadlines.

Change the recovery horizon to inspect projected recovery within a selected number of minutes. Expand the evidence section for observations, sampled duration and net counter changes.
