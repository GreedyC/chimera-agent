# gpt-6-luna holds an agent's context to 256k, the top of the ladder

Run 2026-09-27 against [`PREREGISTRATION_luna.md`](PREREGISTRATION_luna.md) and its two amendments.
- **Calls:** 530 (26 pilot + 504 main), 0 errors, 0 mis-routed rows.
- **Spend:** US$ 4.67 measured (US$ 0.17 pilot + US$ 4.50 main).
- **Routing:** every row was answered by `OpenAI` and billed at 1.00–1.25× the standard input quote,
  which is the standard tier. The largest prompt was 257,534 tokens, under the 272k price step.
- **Reproducing the tables:** `python bench/useful_context/run.py --profile luna --report
  bench/useful_context/results/main_luna.json`. The output is in `results/main_luna-report.txt`.

## The answer, under the registered rule

| | |
|---|---|
| Useful length | **≥ 256k**: the 256k cell, median **255,474** provider tokens. The top of the ladder, so a **lower bound** |
| Proposed trigger, `floor(0.8 × useful, to 1,000)` | **204,000** provider prompt tokens |
| As a `context_budget` fraction of the catalogue's 1,050,000 window | ≈ **0.243** (threshold = window × fraction × 0.8) |
| Today | luna has no `useful_k`, so the budget falls back to the advertised 1,050k window |

## Gates

| gate | result |
|---|---|
| grader self-test, corpus collisions (256k included) | PASS, 0 |
| pilot 4k (≥ 18/20) | **20/20**; 6/6 at 256k |
| positive control, main 4k (≥ 90%) | **72/72** |
| floor: 4k replay | 2/72 discordant, Newcombe [−9.6, +2.7] pp: **PASS, by 0.4 pp** |
| routing (≤ 5% mis-routed) | 0/530 |

**The floor nearly bound.** With no temperature the model samples, and the replay lost 2 of 72
items that the first 4k call got right. Both misses were a naming rule written `@growth` where the
item's rule asked for `@ops`. One more replay loss would have made the length **not resolved** under
the registered rule. Nothing about length did that: it is the noise the floor exists to measure,
and at this n it sits just inside the margin.

## Per length (n = 72, the same items at every length)

| length | median tokens | ok | accuracy | Wilson 95% | failures |
|---:|---:|---:|---:|---|---|
| 4k | 3,592 | 72 | 1.000 | [0.949, 1.000] | — |
| 16k | 15,717 | 72 | 1.000 | [0.949, 1.000] | — |
| 32k | 31,749 | 72 | 1.000 | [0.949, 1.000] | — |
| 64k | 63,653 | 71 | 0.986 | [0.925, 0.998] | 1 `rule_forgotten` |
| 128k | 127,628 | 70 | 0.972 | [0.904, 0.992] | 2 `wrong_service` |
| 256k | 255,474 | 71 | 0.986 | [0.925, 0.998] | 1 `wrong_service` |
| 4k replay | 3,592 | 70 | 0.972 | [0.904, 0.992] | 2 `rule_forgotten` |

## Paired against 4k (Newcombe method 10, 95%; exact McNemar)

| length | 4k only | long only | Δ | 95% CI | p | margin −10 pp |
|---:|---:|---:|---:|---|---:|---|
| 16k | 0 | 0 | 0.0 | [−5.1, +5.1] | 1 | within |
| 32k | 0 | 0 | 0.0 | [−5.1, +5.1] | 1 | within |
| 64k | 1 | 0 | −1.4 | [−7.5, +3.8] | 1 | within |
| 128k | 2 | 0 | −2.8 | [−9.6, +2.7] | 0.5 | within |
| 256k | 1 | 0 | −1.4 | [−7.5, +3.8] | 1 | within |

The losses do not grow with length: 1, 2, 1 from 64k to 256k, against 2 on the 4k replay alone.
On this task and route, nothing in the ladder separates a long context from sampling noise.

## The failures, read by eye

- **`rule_forgotten`**: M024 at 64k (`tamarind-mesh@growth-team@ops`), and M024 and M043 on the 4k
  replay. These are the same confusion between the owning group and `ops`, and it happens at 4k.
  It is the task's ambiguity plus sampling, not forgetting over length.
- **`wrong_service`**:
  - M023 at 128k: the reasoning named the right landmark and then picked the distractor's service.
  - M046 at 128k: `quillSorter` for `zinniaTally`.
  - M068 at 256k: `[bramble-wire]` for `[cobalt-drift]`.
  - These are association errors, three in 216 long calls.
- Every row reasoned (median 32–39 tokens). None answered with a tool call, and none was truncated.

## Predictions, scored

- **P1** the 4k control passes: **right** (72/72).
- **P2** nothing up to 128k falls outside the margin: **right**.
- **P3** 256k is within the margin, so the answer is a lower bound: **right**, stated with low
  confidence.
- **P4** the floor is noisier than v4-flash's but passes: **right** (2/72 against 0/90), and by only
  0.4 pp.

## What it changes (the owner's rule: adopted in a separate PR)

`CatalogEntry.useful_k = 255` for `openrouter/openai/gpt-6-luna`, noted as a **lower bound**
measured to the 256k rung, as registered. With it, the context budget reads 255k instead of the
advertised 1,050k window. That is the same kind of change v4-flash's 128k made.

## Limits

- **One task shape.** An agent transcript that asks for a service by landmark and a naming rule.
  The limits of `PREREGISTRATION.md` apply unchanged.
- **Nothing past 256k.** Past 272k the route bills double.
- **Not a comparison with v4-flash.** The two runs used different routes, different sampling and
  different n, and each is read against its own 4k.
