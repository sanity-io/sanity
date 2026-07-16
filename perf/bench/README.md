# bench

Hermetic studio performance benchmark suite — the eFPS (`dev/efps`) replacement. Measures editing responsiveness, load vitals, and resource usage of a built Studio against a local mock of the Sanity API, and compares a PR's build (**experiment**) against its merge-base build (**reference**) with real statistics.

`dev/efps` is kept for reference and keeps running in CI while this suite burns in.

## Why it exists

The old suite had three structural problems no hardening could fix:

1. **Cross-process timing** — keystroke timestamps in Node vs render timestamps in the browser, matched via marker strings (the "No matching event" flake class).
2. **Remote, live environment** — Vercel-deployed studios against real Sanity APIs; the reference was whatever `main` last deployed, not the PR's merge-base.
3. **Variance-hiding statistics** — best-of-3 merging, a display-only 20% threshold, no gate.

This suite inverts all three:

- **In-browser measurement** via the [Event Timing API](https://www.w3.org/TR/event-timing/) (`interactionId`, input delay / processing / presentation breakdown) and [Long Animation Frames](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongAnimationFrameTiming) with script attribution. One monotonic clock; the runner only orchestrates.
- **Hermetic environment** — both builds served locally over HTTP/2+TLS, backed by an in-process mock of Content Lake built on `@repo/debug-proxy`. Zero secrets on the PR path (the studio auth token is a dummy string).
- **Interleaved A/B sampling with a cluster bootstrap** (tachometer-style): alternate reference/experiment sessions on the same browser, resample _sessions_ (not pooled keystrokes), stop when the 95% CI on the difference of medians is tight enough to decide. Verdicts: 🔴 regression / 🟢 improvement / ✅ neutral / ⚪ **inconclusive** (CI too wide when the budget ran out — never a coin flip).

## Architecture

```
runner (tsx CLI, runs from HEAD)
├── static servers (h2+TLS)     one per side: perf/bench/dist + .reference/dist
├── mock Content Lake (h2+TLS)  one per side: mock-api/* on @repo/debug-proxy
│     actions/mutate/listen(SSE)/doc/query(groq-js)/acl/auth/… + request ledger
├── Chromium (SPKI-trusted cert; CDP CPU throttle; hermeticity route guard)
│     injected collector (instrumentation/): event timing, LoAF, paints, bench:* marks
└── stats (cluster bootstrap, gating) → report (markdown PR comment + BenchRunDocument JSON)
```

### The mock's contract (verified against studio source)

- **Writes go through the Actions API** — `POST /data/actions` (`sanity.action.document.edit`/`.create`), echoed on the SSE listener with `resultRev === transactionId`. See `packages/sanity/src/core/store/document/document-pair/checkoutPair.ts`.
- **The listener is rev-chained**: every mutation event must chain `previousRev → resultRev` from the snapshot's `_rev`; `previousRev` must be _absent_ for `appear`. See `getPairListener.ts` and `utils/sequentializeListenerEvents.ts`. The contract test (`mock-api/__tests__/contract.test.ts`) drives a real `@sanity/client` through all of this.
- Unknown endpoints 404 and are recorded; a session **fails** on unexpected endpoints (mock-drift detector). If your studio change adds an API call, extend the mock in the same PR — like updating types.

### Metrics

| Bucket                  | Metrics                                                                                                                                                                                                                                                                                         | Gated?           |
| :---------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------- |
| Editing responsiveness  | per-keystroke keydown→paint latency (median as eFPS; p75/p90/p99 reported), fast-burst secondary, LoAF blocking + attribution                                                                                                                                                                   | median, CI-based |
| INP (Core Web Vital)    | Interaction to Next Paint under a realistic interaction mix (click a field → type a burst → move on), computed with web-vitals' own percentile-by-count rule over ≥50 interactions; the interaction count travels alongside as confidence context                                               | report-only      |
| Load                    | time to editable (navigation start → the form accepts a keystroke, headline), TTFB/FCP/LCP/CLS web vitals, boot-cold and open-doc-warm conditions, bundle size (exact gzip deltas), auth boot-path milestones (round trips before editable, first-request time, in-flight window — report-only) | time to editable |
| Resources (report-only) | request count/bytes per endpoint class (exact), main-thread CPU-ms (TaskDuration etc.), post-GC heap/DOM-nodes/listeners                                                                                                                                                                        | not yet          |
| Read-only interruptions | count + duration of transient `data-read-only` flips mid-typing                                                                                                                                                                                                                                 | reported         |

The **read-only interruption** metric tracks a real studio bug this suite characterized: `editState.ts` derives `ready: !fromCache` and the editState observable is `publishReplay(1)+refCount()` — subscriber churn around a commit tears it down, the SWR cache re-emits with `ready: false`, and the form silently swallows keystrokes for ~1s. The typing loop pauses (and counts) instead of typing into the void.

## Running locally

Everything is reachable through the `bench` CLI — `pnpm bench help` lists the
commands, `pnpm bench run --help` the flags of a command:

```bash
pnpm build:bench                                  # build packages + the bench studio (experiment config)

pnpm bench scenarios                              # list the available scenarios

# absolute mode (one build, no comparison)
pnpm bench run --scenario singleString --sessions 4

# Self-test: compare the build against itself (same source, both side configs) — must come out all-neutral
pnpm --filter bench build:reference-config
pnpm bench run --scenario singleString --reference-dist perf/bench/.reference/dist

# load vitals + bundle size
pnpm bench run --mode pageload --scenario singleString

# soak check (degradation + leak slope over a long session)
pnpm bench run --mode soak --scenario singleString --minutes 5

# INP (Core Web Vital) under a realistic interaction mix — needs >=50 interactions
pnpm bench run --mode inp --scenario singleString --sessions 3

# interactive debugging: mock + `sanity dev`, type into a seeded doc yourself
pnpm bench dev

pnpm bench:unit                                   # mock contract + stats unit tests
```

The `bench:test`, `bench:dev`, `bench:report` and `bench:store` root scripts
remain as aliases for the corresponding CLI commands. CI-only commands
(`bench prepare-reference`, `bench cert-path`) are documented via `--help`.

Useful `bench run` flags: `--headed`, `--throttle 1` (disable CPU throttle), `--seed 42` (reproducible bootstrap), `--sessions N`, `--budget <seconds>`, `--json-out <path>`, `--fail-on-verdict` (used by the self-test), `--no-network-emulation` (pageLoad).

**Absolute numbers are host-relative.** CPU throttling multiplies whatever the host gives — the printed calibration score (fixed workload, higher = slower) is recorded in every result so runs can be compared honestly. On a loaded laptop expect noise; A/B verdicts absorb it, absolute numbers don't.

## Adding a scenario

1. Schema: `studio/schemas/<name>.ts` exporting a workspace partial; register in `sanity.config.ts`.
2. Scenario: `scenarios/<name>.ts` via `defineScenario` — deterministic fixture (use `scenarios/fixtures/prng.ts`, never `Math.random`), `interactions` (fields to type into; `kind: 'pte'` for Portable Text; `readbackText` if the value isn't a plain string at the field path), seeded image assets if needed (`cdn.sanity.io/images/*` is served a constant PNG by the route guard).
3. Register in `scenarios/index.ts`; add the scenario to the `bench-interaction` matrix in `.github/workflows/bench.yml`.
4. Verify: one absolute session passes with no failures — readback, console errors, hermeticity and endpoint drift are all hard session failures.

## Adding a feature module

A feature module is one file `mock-api/features/<name>.ts` exporting a `FeatureModule` (`name`, optional `featureFlags`, optional `routes`, optional `allow`), registered in `mock-api/features/index.ts`. A scenario opts in via `features: ['<name>']`.

The minimal case (comments) is flags-only: it rides the generic `/data/*` plane, so it only adds a `/features` flag and no routes.

The `allow` allowlist is a report-only bootstrapping escape hatch - a 404'd endpoint means the feature is degrading, so never ship a benchmark whose target feature is allowlisted rather than served.

`bench dev --scenario <name>` seeds and opens any scenario (default `singleString`) with its features active - the interactive way to verify a feature module.

## CI (`.github/workflows/bench.yml`)

- **Label-gated during burn-in**: PR jobs run only with the `trigger:perf-bench` label. The all-code-PRs gate is wired and one condition away.
- **Reference build**: `git worktree` at the merge-base with HEAD's committed `perf/bench/` tree checked out over it — harness and scenarios identical on both sides, only `packages/*` differs. Cached by merge-base sha; falls back to absolute mode (with a warning in the report) if the build fails or the merge-base predates the suite.
- **Sharding**: one job per scenario + one pageLoad job; wall-clock = build + slowest scenario. Budgets are caps — the stopping rule exits early when the CI converges.
- **PR comment**: always posted/updated in place (`bench-report` tag). Non-gating during burn-in.
- **Self-test** (weekly cron / `workflow_dispatch` with `self_test`): compares a build against itself with `--fail-on-verdict` — any non-neutral metric is a harness bug, not a product change.
- **track-main** (daily cron, or `workflow_dispatch` with `run_suite`): absolute-mode run with fixed session counts + soak, stored as a `benchRun` document in the studio-metrics project (`c1zuxvqn`/`bench`) via `BENCH_METRICS_WRITE_TOKEN` — the only real secret in the suite. The dispatch path lets a maintainer run the full suite + store on demand (backfill a point, or verify the store path) without waiting for the 5am cron.

## Flake resistance rules

1. No fixed sleeps — every wait is condition-based (readiness = probe keystroke observably lands).
2. Noise widens sampling, never flips verdicts — budget exhaustion yields ⚪ inconclusive.
3. Seeded PRNG everywhere; same `--seed` reproduces the analysis.
4. Failed sessions are discarded, classified, logged, and retried; 3 consecutive failures aborts hard. Retry counts ship in every result document (flake is a tracked metric).
5. Environment drift fails fast: unexpected network → hermeticity violation; unexpected API endpoint → session failure naming the endpoint.

## Known caveats

- **Event Timing floor**: interactions faster than 16ms are unobservable (spec minimum `durationThreshold`, 8ms duration granularity). Interaction sessions therefore run under **4× CPU throttle**, which lifts typical latencies above the floor and amplifies regressions relative to noise. Keystrokes that still produce no entry are recorded at the 16ms floor and counted (`belowFloorCount`).
- **Warm loads need a valid cert**: Chromium refuses to HTTP-cache responses from origins with certificate errors, so the runner trusts the self-signed bench cert via `--ignore-certificate-errors-spki-list` (never Playwright's `ignoreHTTPSErrors`).
- **HTTP/2 is load-bearing**: over h1, the browser's 6-connections-per-host limit starves the studio's concurrent SSE listeners and the UI never settles.
