---
name: sanity-radar-investigate
description: Investigate a suspected Studio performance regression surfaced by Studio Radar or the bench suite — confirm the signal against host calibration, narrow the commit range, confirm with an A/B dispatch, bisect, and name the culprit or call it noise. Use when handed a Radar "investigation prompt" (starts with "Investigate a suspected performance regression in the sanity-io/sanity monorepo"), a drift flag, a red 🔴 verdict in a bench PR comment, or asked whether commit X, PR Y or release Z regressed a studio metric.
---

# Investigating a studio performance regression

The output is a verdict with evidence: **culprit commit/PR**, **host or harness artifact**, or
**noise**. Trend points are host-relative daily samples; only an interleaved A/B run decides.
Data access and query shapes are in the `sanity-radar` skill (`references/groq-recipes.md`);
dispatching runs is in `sanity-bench`.

## Rules that keep the verdict honest

- **Never conclude from two absolute points.** Run-to-run noise on main is ~12% at the median, above the gate's 5% threshold. A point-to-point delta is a hypothesis, an A/B verdict is evidence.
- **Read the host first.** `runner.calibrationMs` (higher = slower) and `runner.cpuModel` per run and per scenario shard. A metric step that coincides with a calibration step, or a CPU model change, is the host until an A/B says otherwise. GitHub rotates runner hardware under the same vCPU shape.
- **Check the instrument.** A Playwright/Chromium bump moves INP and vitals with no studio change (`runner.browserVersion`). A change under `perf/bench/` (scenario, mock, harness) moves everything in that scenario at once.
- **⚪ inconclusive means widen, not shrug.** The CI stayed too wide within the budget; re-dispatch, or look at which side had failures (`scenarios[].failures`).
- **A level step is not a leak.** DOM nodes, listeners or heap moving to a new plateau (and staying) is a behavior change; the soak slope (`soak`) is what detects leaks.
- **Say what you did not verify.** A shortlist is a shortlist until a dispatch confirms it.

## Procedure

1. **Pin the signal.** From the prompt/flag: series (scenario · metric), the suspicious run's sha and the previous run's sha, the delta. Fetch both runs with calibration/cpuModel/browserVersion, and every other run of the same sha (re-runs exist; if a re-run on a faster host reproduces the value, it is the commit). Confirm the metric moved on the same field in other scenarios or stayed local to one.
2. **Rule out the host and the harness.** Calibration and CPU model steady across the step → proceed. Otherwise note it and let the A/B decide; do not stop here, a real regression can land on a slow day.
3. **Narrow the range.** GitHub compare `https://github.com/sanity-io/sanity/compare/<from>...<to>` or the `gitCommit` window query. Shortlist commits that could move this metric: studio runtime under `packages/sanity/src`, dependency bumps (`@sanity/ui`, react, rxjs, styled-components, vite), build config, `perf/bench` itself. Ignore docs/test/CI-only commits unless the harness is the suspect.
4. **Confirm with an A/B dispatch** (the same harness CI uses, bootstrap-gated verdicts):
   ```bash
   gh workflow run bench.yml -R sanity-io/sanity -f ab_from=<full reference sha> -f ab_to=<full experiment sha>
   gh run list -R sanity-io/sanity --workflow bench.yml --event workflow_dispatch --limit 3   # find the run id
   gh run watch -R sanity-io/sanity <run-id>
   gh run view  -R sanity-io/sanity <run-id> --json jobs --jq '.jobs[] | {name, conclusion}'
   ```
   ~30 minutes. The verdict table is on the run's summary page (`gh run view --web`), and the comparison is stored as a `mode: "ab"` benchRun (Comparisons tool, or the GROQ recipe). Both builds fail loudly; a failed `build`/`build-reference` job usually means one sha predates the tarball recipe or does not install with `--frozen-lockfile`.
5. **Bisect if the range is long.** Halve with further dispatches: log₂(N) runs find the commit. Each result is stored, so a session survives context loss — list `mode == "ab"` runs to resume. For regressions a human can _see_ (jank, a slow open) use the Radar Bisect tool instead: it walks the first-parent chain and hands out each commit's `testStudioUrl` preview build.
6. **Reproduce locally when the mechanism is unclear** (numbers are host-relative; use for profiling, not verdicts):
   ```bash
   pnpm build:bench && pnpm bench run --scenario <scenario> --sessions 4 --headed
   pnpm bench prepare-backfill --sha <sha>   # build a historical commit into perf/bench/dist
   ```
   LoAF attribution (`scenarios[].loafAttribution`) and CLS attribution in the stored run name the scripts/elements involved.
7. **Report.** Culprit sha + PR (or "host"/"noise"), the metric table (reference → experiment, Δ with CI, verdict) copied from the A/B run, the mechanism if known, confidence, and what was not checked. Note whether the change is a deliberate trade (say so, and where the trade is documented) or an unintended regression worth a fix or an upstream issue. For a shipped regression, attribute it to the release that first contained the commit (Releases tool → "Add regression" creates the record).

## Priors from past investigations

- `@sanity/ui` v4 (`bdf98a3448`) doubled DOM nodes and listeners across every scenario: overlays keep children mounted via `<Activity>`. A deliberate level step, not a leak — but it also added an auth round trip at boot by mounting deferred workspace-menu probes.
- Auth round trips (`boot-cold · auth round trips`, `auth in flight`) grow by whole emulated round trips (~45ms each) — count real requests in `resources.experiment.byClass[endpointClass == "auth"][0].count` (the session-wide ledger), not just the boot window.
- Runs of one sha often differ by ~20% of calibration across hosts; that is the noise floor for absolute reads.
