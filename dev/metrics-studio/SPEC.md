# Metrics-studio dashboard

One place to answer three questions without opening CI logs: **is studio
performance drifting on main?** (Trends), **what did a specific run look
like?** (run detail), **did anything change that needs a human?** (drift
feed). Primary users: studio engineers checking the effect of merged work;
secondary: leads scanning health weekly.

## Data reality

- One `benchRun` document per day from the `track-main` cron (absolute mode,
  fixed 8 sessions): per-scenario interaction metrics (p50/p75/p90/p99 per
  field), pageLoad time-to-editable + web vitals + auth boot-path milestones,
  bundle sizes (initial/total gzip), resources per endpoint class, soak
  series, `runner.calibrationMs`, git sha. Written by `bench store`
  (perf/bench/report/storeToSanity.ts); stored shape defined by
  perf/bench/report/storeShape.ts and mirrored by schemaTypes/benchRun.ts.
- Volume is tiny (≤366 docs/year) but documents are heavy (per-session sample
  arrays) — **dashboard queries must project summaries, never fetch
  `sessions`**.
- **Honesty constraint:** absolute numbers are host-relative. Every trend
  view carries a calibration overlay (`runner.calibrationMs`, higher =
  slower host) so a "regression" that is really a slower runner pool is
  visible as such. This is the dashboard's version of the suite's fail-loud
  principle.
- PR A/B runs are _not_ stored (by design). The dashboard is main-branch
  health; PR verdicts live in PR comments.

## Views

1. **Trends** — the first tool and the studio's default view. Small-multiples
   grid, one chart per scenario·metric (keystroke latency medians,
   time-to-editable, bundle initial JS, auth trips/in-flight), x = run date,
   line = p50, shaded band = p75–p90, dots link to the run document.
   Calibration strip at the top. Time range picker (30/90/all).
2. **Run detail** (P2) — click-through from a dot: the PR-comment tables
   (absolute variant), soak slope chart, flake telemetry, run metadata.
3. **Drift feed** (P2) — computed client-side, flagging a metric when it
   clears the same `rel`/`absMs` thresholds the gate uses
   (perf/bench/stats/gate.ts — one source of truth for "what matters").
   Two baselines, both shown when they disagree:
   - **trailing:** last-7-runs median vs the prior-21-runs median (slow
     drift)
   - **step:** latest run vs the median of the same weekday's last 4 runs
     (sudden jumps, robust to day-of-week runner variance)

## Architecture

- A custom **tool pane** (`defineTool`) in this studio, registered _first_ so
  Trends is the landing view; the structure tool stays for raw document
  access.
- **All views are realtime**: data via `useDocumentStore().listenQuery` +
  `useObservable` (never one-shot `client.fetch`), so a new cron run appears
  without a reload. Tight projections only. No rollup documents — with
  ≤1 doc/day, projected queries over all runs are fast; revisit only if that
  stops being true.
- **Dev debug sources** (dev-server only): deterministic synthetic datasets
  (`tools/trends/debugData.ts` — steady/drift/step/host-correlated shapes,
  sparse/single/empty sets) selectable in the toolbar, so charts and the
  future drift feed are testable without live data.
- **Charts: visx** (`@visx/scale`, `@visx/shape`, `@visx/group`,
  `@visx/axis`, `@visx/responsive`) — low-level primitives, no chart-library
  opinions to fight inside `@sanity/ui` layout.
- Deployment: `sanity deploy` eventually; hostname TBD.

## Phasing

- **P1:** Trends tool (small multiples + calibration strip + range picker),
  registered as the first tool.
- **P2:** run detail view + drift feed (both baselines).
- **Later:** Slack alerting (a Sanity Function on `benchRun` create running
  the drift computation — event-driven, no cron); broader health metrics
  (coverage reports from CI's `json-summary`, flake rates) as sibling
  document types with their own trends tabs.
