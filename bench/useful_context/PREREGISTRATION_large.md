# Useful context of the 1M-window models: glm-5.3-flash and glm-5.3 — pre-registration

**Written 2026-09-27, before any paid call of this design. No outcome of it has been seen. Not run
until the owner approves the budget below.**

**Budget decision, 2026-09-29 (the owner, in the session), recorded before any call:** `glm-5.3-flash`
only, to 900k, capped at **US$ 8**. `glm-5.3` is **not** approved and is not run; its column stays
here as the registration for whenever it is. Nothing in the design below changed after this
decision. The conservative rule for unmeasured models that "Why these two" says was being proposed
shipped as #684 (`AgentConfig.unmeasured_context_tokens`, 64k); what this run measures is what would
replace it for this model.

Owner-assigned (2026-09-27, task 5: "256k context and bigger models, without the tasks stalling").
The same bench, task, items, grader, gates and decision rule as [`PREREGISTRATION.md`](PREREGISTRATION.md)
and [`PREREGISTRATION_luna.md`](PREREGISTRATION_luna.md). Only what is listed here changes.

## Why these two

- **`z-ai/glm-5.3`** is the `top` rung of the default cost ladder and the escalation model without
  an OpenRouter key (`verified.escalation_model`).
- **`z-ai/glm-5.3-flash`** is a `mid` model with the same window at a tenth of the price, which
  makes measuring to 1M affordable.
- Both advertise 1,048,576 tokens, and both have no `useful_k`. Until they are measured, the
  context budget uses the conservative rule for unmeasured models, which is being proposed in the
  PR on limits.

Left out: `gpt-6-sol`, `gpt-5.5` and `claude-opus-5`, which bill US$ 2–5 per M, and double past
272k for the OpenAI models. That is a separate decision, with its own money.

## What changes

Selected with `run.py --profile glm53flash` and `--profile glm53`. The `v4flash` and `luna` profiles
render byte for byte as before: both committed reports reproduce identically, checked.

| | glm53flash | glm53 |
|---|---|---|
| route | `Sail Research`, fp8, no fallbacks | `Baidu`, fp8, no fallbacks |
| why the route | the cheapest fp8 endpoint serving 1,048,576 tokens on the listing read 2026-09-27 | the same |
| prices / M (in, cached, out) | 0.045 / 0.0285 / 0.60 | 0.3556 / 0.06604 / 1.1176 |
| temperature | 0.0, as the v4-flash run (both take one) | 0.0 |
| ladder | 4k … 256k, **512k, 900k** | 4k … 256k, **512k** |
| tier check | a row billed outside 0.8–1.35× the quote is mis-routed | the same |
| filler corpus | **`chimera/` + `tests/`** | the same |

**Why the corpus grows.** Past ~256k the `chimera/` sources run out, and the filler repeats
itself: 23 repeated tool results at 512k and 144 at 1M, measured at US$ 0. Internal repetition is a
confound of its own. With `tests/` added (1,030 files instead of 383), there is 1 repeat at 512k
and 2 at 900k out of ~890 units, with 0 corpus collisions and the grader self-test passing. The 900k
top rung leaves room under the 1,048,576 window for the output.

**Catalogue price note.** The catalogue lists glm-5.3 at 1.40/M. The live listing's cheapest route is
0.3556/M. The catalogue price is a separate fix, not part of this measurement.

## n and budget (the owner approves before any call)

- **Pilot per model:**
  - `P000–P019` at 4k, and `P000–P005` at the top rung.
  - Gate: ≥ 18/20 at 4k.
  - It recalibrates chars-per-token from the top-rung rows. This is the same rule as the luna run.
- **n rule:** the largest multiple of 18 under the approved budget, capped at 72. The projection is
  linear in prompt tokens from the pilot's cost.
- **Estimate** (≈ 1.92M tokens per item for glm53flash, ≈ 1.02M for glm53, plus the replay):

  | model | per item | n = 72 | n = 54 | proposed cap |
  |---|---:|---:|---:|---:|
  | glm53flash (to 900k) | ~US$ 0.087 | ~US$ 6.3 | ~US$ 4.7 | **US$ 8** |
  | glm53 (to 512k) | ~US$ 0.36 | ~US$ 26 | ~US$ 19.6 | **US$ 22** (n = 54) |

## What the answer changes (adopted in a separate PR)

`useful_k` for each model is the useful cell's median / 1000, labelled a lower bound if it is the
top rung. If a model's answer is **not resolved** or **below 16k**, nothing is written.

## Predictions

- **P1:** both 4k controls pass.
- **P2:** glm53flash holds to 256k, and drops outside the margin somewhere in 512k–900k.
  Confidence low. This is the first rung of this bench past 256k.
- **P3:** glm53 holds to 512k (a lower bound).

## Addendum — 2026-09-29, after the glm53flash pilot, before its main run

**Pilot (`results/glm53flash_pilot.json`):** 26 rows, **20/20 at 4k** (gate ≥ 18: PASS). At the 900k
top rung: 4 correct (P002–P005), 1 wrong (P001, `rule_forgotten`), 1 **timeout** (P000, 953 s, counted
as an error and never as a zero). Every row came from the registered route (`Sail Research`); no row
was flagged by the tier check. **US$ 0.1161.** As registered, the pilot's outcomes do not enter the
analysis.

**A first launch that produced nothing, recorded so it is not lost.** The first pilot ran with the
runner's default of 6 workers and was stopped by hand after ~10 minutes with no item finished and no
results file. The runner prints a line only when an item's calls all return, and each of P000–P005
holds a ~800k-token call, so the silence was the six concurrent large calls failing and retrying. The
error text was not captured, so the cause is a hypothesis: provider-side timeouts under concurrency.
That attempt's spend was **not recorded**. It is bounded by its US$ 1.50 cap, and the OpenRouter
dashboard is the place to read it. Two single-call probes made before the relaunch cost about
US$ 0.0227 (one 4k call, one 900k call), both answered correctly.

**Registered recalibrations and fixed parameters:**

- **chars per token = 4.35**, the median of `est_chars / prompt_tokens` over the five 900k rows that
  returned (4.342–4.368), rounded to 0.01. At the default 3.8 the 900k rung realised only ~786k
  provider tokens (12% under its label). At 4.35 it projects to ~900k, and the filler grows from ~754
  to ~865 units. A sample of the corpus at 4.35 finds 2 repeated calls in 864 for item M000, the same
  figure this document already reports for 900k; the full sample is published with the results.
- **n = 72.** The rule is the largest multiple of 18 under the approved budget, capped at 72.
  An item is the ladder plus the 4k replay, 9 calls and ~2.19M prompt tokens at 4.35. At the quoted
  input price (no cache credit, the ceiling) that is ~US$ 0.099 per item and **US$ 7.10** for 72. At
  the pilot's measured effective price (US$ 0.0291 per M prompt tokens, because 785,998 of 785,999
  tokens of each 900k call were served from cache) it is ~US$ 4.6. Both are under US$ 8.
- **Main-run cap: US$ 7.50**, so that pilot, probes and the unrecorded first attempt stay inside the
  approved US$ 8.
- **Workers: 3.** An execution parameter, not a design one: 6 workers produced the silent failure
  above, 2 workers ran the pilot with one timeout in 26 calls. Errors are counted per rung and
  published; the runner's stop rule (errors above 10% of rows after 30) is unchanged.

**A confound to carry into the reading, not to hide.** Almost the whole 900k prompt is served from
the provider's cache, and every row carries `cached_tokens`. Prefix caching can change a hosted
model's output relative to an uncached call (the route and cache go on the receipt since #484), so
the reading is of *this route with its cache behaviour*, which is how it will be used. If the errors
concentrate at the top rung, that is a result about the rung, and it is reported as one.

## What this cannot show

- Other task shapes; the limits of `PREREGISTRATION.md` apply.
- Other routes of the same model. A different endpoint and quantization may read differently.
