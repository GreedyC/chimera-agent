# Useful context of gpt-6-luna, the new product default — pre-registration

**Written 2026-09-27, before any paid call of this run. No outcome of it has been seen.**

The same bench, task, items, grader, gates and decision rule as [`PREREGISTRATION.md`](PREREGISTRATION.md)
(run 2026-09-25 on `deepseek-v4-flash-0731`, [`RESULTS.md`](RESULTS.md)). Everything not listed here
is **unchanged** and binds this run as written there. Owner-assigned (session brief 2026-09-27, item 3).

## Why

0.62.0 made `openrouter/openai/gpt-6-luna` the default model. Its catalogue row has **no `useful_k`**
("nobody has measured the context it still reads well"), so `chimera/core/context_budget.py` falls
back to the advertised window (1,050k) for it. The number measured for v4-flash does not transfer:
it is a property of a model and a route, and luna is a different model.

## What changes, and why each change

Selected with `run.py --profile luna`. The default profile (`v4flash`) is byte-for-byte what produced
`results/main.json`.

| | v4-flash run | this run | why |
|---|---|---|---|
| model | `deepseek-v4-flash-0731` | `openai/gpt-6-luna` | the new default |
| route | `DeepInfra`, no fallbacks | `OpenAI`, no fallbacks | OpenRouter lists OpenAI (flex, standard, fast), Azure and Bedrock; the product sends no pin, and the reviewer bench found the unpinned route billed at OpenAI's standard price |
| tier check | — | a row billed outside **0.8–1.25×** the standard quote is **mis-routed** | flex (0.5×) and fast (2×) report the same provider name, so the price is the only way to tell them apart |
| prices / M | 0.060 / 0.015 / 0.180 | **0.10 / 0.01 / 0.50** | OpenAI standard, endpoints listing read 2026-09-27, below its 272k price step |
| temperature | 0.0 | **not sent** | the model takes none |
| ladder | 4k … 128k | **4k … 128k, 256k** | v4-flash's answer was a lower bound at 128k. 256k is the largest rung under the 272k price step. Checked at US$ 0: 207 filler units at 256k, all distinct, 0 corpus collisions, grader self-test PASS |

**Consequence of no temperature.** The 4k replay is no longer byte-identical, so the replay floor
measures **sampling noise**, which is what it exists for. The FLOOR GATE is unchanged: if the Newcombe
lower bound of (replay − 4k) is below −10 pp, the useful length is **not resolved**.

## n, pilot and budget

- **Pilot:** `P000–P019` at 4k and `P000–P005` at 256k, 32 calls, cap **US$ 0.40**. Same purpose and
  gate as before (≥ 18/20 at 4k). It also recalibrates chars-per-token once, from the median of
  `est_chars / prompt_tokens` over its 256k rows, rounded to 0.01. Its outcomes do not enter the
  analysis.
- **n rule** (written now): the largest multiple of 18 whose projected main-run cost is ≤ **US$ 6.00**
  minus pilot spend minus US$ 0.20 reserve, capped at **90**. The projection is linear in prompt
  tokens from the pilot's measured cost per call. The cap of 90 is the n of the v4-flash run.
  Expected: **n = 90**, at about US$ 5.1. Written into an addendum, with the pilot's numbers, before
  the main run.
- **Total cap US$ 6.40.** Estimate: ~US$ 5.3.

## What the answer changes (the owner's rule: adopted in a separate PR)

- `CatalogEntry.useful_k` for luna = the useful cell's median provider tokens / 1000, rounded down. If
  the answer is "≥ 256k", it is the 256k cell's median, **labelled a lower bound** in the note.
- If the useful length is **not resolved**, or falls **below 16k**, nothing is written to the
  catalogue, and the result is published as such.

## Predictions

- **P1.** The 4k control passes (≥ 90%).
- **P2.** Nothing up to 128k falls outside the margin.
- **P3.** 256k is within the margin too, so the answer is a lower bound again. Confidence **low**: the
  v4-flash margin nearly bound at 128k (lower bound −9.3 pp), and NoLiMa-style drops grow with length.
- **P4.** The floor is noisier than v4-flash's (which had 0/90 discordant), but the FLOOR GATE passes.

## What this cannot show

- Whether luna and v4-flash differ. The two runs are on different routes and different sampling,
  unpaired in time. Each is read against its own 4k, never against the other.
- Anything past 256k, or past the 272k price step, where the route bills double.
- Other task shapes. The limits in `PREREGISTRATION.md` still apply.

## Amendment 1 — 2026-09-27, before any answered call

- **First pilot launch: 26 calls, all refused with a 401, US$ 0.00.** Launched from a git worktree,
  litellm's own `.env` lookup started from the script's folder, which has no `.env`, so no key was
  sent. No model answered; nothing was seen. The runner now loads the working directory's `.env`
  itself before a pilot or a run, and the key is never printed. The failed pilot file was deleted:
  it held only the 401s.
- **The pilot is 26 calls, not 32:** 20 at 4k and 6 at 256k. The count above was an arithmetic
  slip; the design is unchanged.
