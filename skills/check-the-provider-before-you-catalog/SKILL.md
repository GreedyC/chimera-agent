---
name: check-the-provider-before-you-catalog
description: A model catalogue entry is a claim about a live provider; verify the provider's current documentation before recording a slug, price, context window, or capability.
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

You are about to add or change a model catalogue entry. Treat each field as a separate external
claim: a model slug, price, context limit, modality, or tool capability can change independently.

## Do

1. Open the provider's current model or pricing documentation, not a search snippet or an old
   benchmark. Record the URL and the date checked in the change description.
2. Copy the provider's exact model identifier. Do not normalize a slug from memory or infer a
   successor from a similar name.
3. Set unknown prices or limits to `None` rather than guessing. A missing field is honest; a stale
   number can silently route work or calculate cost incorrectly.
4. Check whether the catalogue already has the slug, and run its duplicate and invariant tests.
5. If the provider page is ambiguous, leave the entry unchanged and open a question instead of
   converting uncertainty into data.

## Avoid

Do not use a model's marketing name as its API identifier, copy a price from a third-party table,
or mark tools as supported merely because another model in the family supports them.

## Check

Run the catalogue invariant tests and inspect the resulting entry with the normal CLI. A test that
only checks the tuple is non-empty will not catch a plausible but wrong price or slug.

## Risk

Provider pages can change after a contribution is merged. Keeping the source URL and check date
in the review record makes later refreshes possible and prevents an unverified value from looking
permanent.
