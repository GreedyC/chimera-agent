---
name: check-the-provider-before-you-catalog
description: Verify the route's live index before recording a model slug, price or served context window.
version: 0.1.0
kind: pattern
stage: verify
topic: ai-agents
triggers:
- adding a model to a provider catalogue
- updating model prices or context windows
- a provider renamed a model
- a catalogue entry looks stale
provenance: clean
status: active
license: Apache-2.0
---

## Trigger

You are changing a model catalogue. Identifiers, prices, limits, modalities and tool support can change independently.

## Do

Take the exact slug, price and served window from the live OpenRouter index through `chimera.providers.listing`; record the source and check date. When a row's price differs from the index, retain the old pair in `also_seen` rather than overwriting its history. Keep unknown values as `None`, never guessed. Check for duplicates. If the source is ambiguous, leave the entry unchanged and ask.

## Avoid

Do not copy prices or windows from a vendor's marketing page or another model. Do not overwrite `also_seen` history. An advertised window is not necessarily the window the route serves.

## Check

Run the catalogue unit tests and `tests/test_catalog_is_live.py` (a network check run on main), then inspect the entry through the CLI. Non-empty fields alone do not prove correctness.

## Risk

The live index can change after merge as routes and prices change. Source references and check dates make updates traceable; they do not guarantee future accuracy. Receipts are priced from the live index; the catalogue row is a fallback.
