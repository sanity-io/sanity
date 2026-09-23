---
name: sanity-bench
description: Run, dispatch and read the hermetic Studio performance benchmark suite in perf/bench — local runs and modes, the trigger:perf-bench PR label, the Studio Bench workflow_dispatch inputs (run_suite, self_test, backfill_sha, release_tag, ab_from/ab_to) and which combine, and how to read 🔴🟢✅⚪ verdicts. Use when asked to benchmark a PR or commit, compare two commits, backfill or re-run the daily main series, measure a release, add a bench scenario, extend the mock API, or interpret a bench PR comment or a failed Studio Bench run.
---

# Studio bench (perf/bench)

A built studio measured in Chromium against an in-process mock of the Sanity API: no tokens, no
network, one clock. The interesting output is an **A/B verdict per metric** from interleaved
reference/experiment sessions with a cluster bootstrap — 🔴 regression, 🟢 improvement, ✅ neutral,
⚪ inconclusive (CI too wide within budget; never a coin flip). Absolute numbers are host-relative
and only comparable with the run's calibration score alongside. `perf/bench/README.md` is the
full reference; this skill is the operating card. Stored results are read through `sanity-radar`.

## Local

```bash
pnpm build:bench                                              # required first: packages + bench studio
pnpm bench help                                               # commands; `pnpm bench run --help` for flags
pnpm bench scenarios                                          # singleString, arrayI18n, article, recipe, synthetic, syntheticLarge
pnpm bench run --scenario singleString --sessions 4           # absolute interaction run
pnpm bench run --mode pageload --scenario singleString        # load vitals + bundle size
pnpm bench run --mode inp --scenario singleString --sessions 3
pnpm bench run --mode soak --scenario singleString --minutes 5
pnpm --filter bench build:reference-config \
  && pnpm bench run --scenario singleString --reference-dist perf/bench/.reference/dist   # self-test: must be all-neutral
pnpm bench prepare-backfill --sha <sha>                       # build a historical commit into perf/bench/dist (tarball recipe)
pnpm bench dev                                                # mock + sanity dev, type into a seeded doc
pnpm bench:unit                                               # mock contract + stats tests
```

Flags worth knowing: `--headed`, `--throttle 1` (interaction runs default to 4× CPU throttle),
`--seed N`, `--budget <s>`, `--json-out <file>`, `--fail-on-verdict`. In a sandbox where the `tsx`
CLI cannot open its IPC pipe (`listen EPERM … tsx-*/…pipe`), run the CLI directly:
`node --conditions=monorepo --import tsx perf/bench/cli/index.ts <command>`.

## CI: `.github/workflows/bench.yml`

| Trigger                                                | What runs                                                                                                                             | Result lands in                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Label a PR `trigger:perf-bench` (maintainers)          | PR head vs merge-base A/B, one shard per scenario. The label persists: every later push re-runs the suite until the label is removed. | Sticky PR comment `bench-report`; absolute side stored under the branch (`?branches=main,<branch>` in Radar) |
| Cron 05:00 UTC daily                                   | Absolute suite on main + soak + INP                                                                                                   | `benchRun` `mode: "absolute"` in Radar (Trends)                                                              |
| Cron Monday 06:00 UTC                                  | Self-test (build vs itself, `--fail-on-verdict`)                                                                                      | Red job = harness drift                                                                                      |
| `-f run_suite=true`                                    | Same as the daily cron, on demand                                                                                                     | Radar                                                                                                        |
| `-f run_suite=true -f backfill_sha=<40-char sha>`      | Replay a historical main commit, store under that sha and its commit date                                                             | Radar (fills a hole in the series)                                                                           |
| `--ref v6.x.y -f run_suite=true -f release_tag=v6.x.y` | Measure a release commit (`release-latest.yml` does this automatically)                                                               | Radar, `trigger: "release"` → anchors the release marker                                                     |
| `-f ab_from=<sha> -f ab_to=<sha>`                      | A/B of two arbitrary commits (reference → experiment)                                                                                 | Run summary page + `benchRun` `mode: "ab"` (Radar Comparisons tool)                                          |
| `-f self_test=true`                                    | Self-test on demand                                                                                                                   | Job status                                                                                                   |

```bash
gh workflow run bench.yml -R sanity-io/sanity -f ab_from=<sha> -f ab_to=<sha>
gh run list -R sanity-io/sanity --workflow bench.yml --event workflow_dispatch --limit 5
gh run watch -R sanity-io/sanity <run-id>; gh run view -R sanity-io/sanity <run-id> --web
```

Input rules (the workflow validates them): `ab_from`/`ab_to` go together and exclude
`backfill_sha` and `self_test`; `backfill_sha` requires `run_suite` and excludes `self_test`;
`release_tag` must point at the measured commit (dispatch at the tag, or pass the tag's sha as
`backfill_sha` from main). Shas are full 40 characters. Historical builds (backfill, A/B, PR
reference) install the old commit with `--frozen-lockfile`, pack `sanity` and its workspace deps
as tarballs, and build HEAD's `perf/bench` harness against them — harness and scenarios are
always HEAD's; only product code differs. Backfill and A/B fail loudly, the PR reference falls
back to absolute mode with a warning in the comment.

Radar's run popover copies the A/B command for "this point vs the previous run" (**Copy A/B vs
previous run**) so the shas never need typing.

## Reading a result

- The PR comment / run summary is deliberately minimal: verdicts, then a link to Radar. A missing scenario is named (`missing-scenarios.json` fails the run) — silence is never "fine".
- Gates: interaction median with `absMs` 16ms floor (two Event Timing quantisation steps), pageload time-to-editable; INP, vitals, resources, bundle are report-only. Thresholds live in `perf/bench/stats/gate.ts` and are shared with Radar's drift feed.
- ⚪ on a heavy scenario usually means the budget ran out; re-dispatch or look at `stoppedBy` and `failures` in the stored run.
- A `hermeticity violation` or `unexpected endpoint` session failure means the studio made a request the mock does not know: extend `perf/bench/mock-api` in the same PR as the studio change.

## Changing the suite

- New scenario: schema in `perf/bench/studio/schemas`, `defineScenario` in `perf/bench/scenarios` (seeded PRNG, never `Math.random`), register in `scenarios/index.ts`, add it to the `bench-interaction` matrix **and** `BENCH_EXPECTED_INTERACTION_SCENARIOS` in `bench.yml`, verify one absolute session passes.
- Stored document shape: `perf/bench/report/types.ts` → `storeShape.ts`, mirrored by `dev/radar/schemaTypes/benchRun.ts`; bump all three together.
- Flake rules are in the README (no fixed sleeps, noise widens sampling, seeded PRNG, failed sessions retried and counted, environment drift fails fast). A change that makes a verdict flip on identical builds is a harness bug — the weekly self-test exists to catch it.
