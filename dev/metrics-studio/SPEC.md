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
   line = p50, shaded band = p75–p90; clicking anywhere in the plot opens the
   nearest run's document (the run under the crosshair is marked on hover /
   keyboard focus — there are no resting dots, which at 30–90 runs in a small
   multiple were mostly ink).
   Calibration strip at the top. Time range picker (30/90/all).
2. **Run detail** (P2) — click-through from a dot: the PR-comment tables
   (absolute variant), soak slope chart, flake telemetry, run metadata.
3. **Drift feed** (P2) — computed client-side, flagging a metric when it
   clears the same `rel`/`absMs` thresholds the gate uses
   (perf/bench/stats/gate.ts — one source of truth for "what matters").

   One baseline: the median of the last 7 runs vs the median of the prior 21.
   Smoothing both sides is what makes it trustworthy — one noisy run barely
   moves a median of 7, so a flag means a sustained shift.

   Windows are counted in **runs, not days**, and the UI says so ("vs prior 21
   runs"): the cron aims for one run a day, but the history has gaps and
   same-day doubles, so a day-based label would be a guess.

   `buildSeries` merges runs of the same commit into one point (their median), so
   both the charts and drift see one point per commit. CI re-runs the suite on a
   commit fairly often — 4 shas in the stored history have 2–3 runs each — and a
   run document can contribute several points to one series (the pageload
   scenario stores the INP metric twice). Unmerged, that stacked several dots on
   one x-position, gave the commit several votes in every median, and made a
   "21 runs" window cover fewer than 21 commits of history.

   Median rather than mean, matching the p50 language used throughout: one
   throttled or failed re-run can't drag the point. The merged point keeps a real
   run's identity so click-through opens an actual document.

   Honesty cost, stated plainly: re-runs of one commit often land on hosts of
   different speed (sha `7147d045`'s two runs differ by 21% of calibration), so a
   merged point averages across hosts. The **calibration strip is deliberately
   not merged** — showing per-run and cross-shard host spread is its whole job.

   There was a second, faster **step** baseline (latest run vs a median of
   recent runs), meant to catch a jump the day it landed. It was removed:
   measured against the stored history it fired on 74–92% of runs at every
   window size tried, because run-to-run noise (~12% median) is well over the
   5% threshold. Two baselines were also impossible to tell apart in the UI
   while one of them fired constantly. Catching a single-run jump needs a more
   precise measurement (more sessions per run), not different arithmetic.

   An earlier version of step compared against the last 4 runs on the _same
   weekday_, to control for day-of-week CI runner load. The stored history does
   not support that either: weekday and weekend `calibrationMs` medians are
   identical (7.60 vs 7.60) and only ~14% of calibration variance sits between
   weekdays. Host speed is handled by the per-run `runner.calibrationMs`
   measurement instead.

   **Every** chart with enough history draws its baseline as an overlay — not
   only the flagged ones. "Recent level vs prior level" is a useful reference
   whether or not it crossed a threshold, and drawing it only on flagged charts
   made the reference lines appear and vanish as metrics moved over the line. A
   sub-threshold comparison is `direction: 'neutral'`: drawn in muted grey, and
   filtered out of the review feed and the tab counts (`useDriftState`), so the
   badge stays the signal for "this needs a look".

   The overlay is the two window medians as a step (dashed "before", solid
   "after", connected at the window boundary),
   each spanning the runs it was measured over, so the header badge's percentage
   can be checked against the runs that produced it. The overlay introduces **no
   new statistic**: it draws what the gate thresholds already decided, so the
   host-relativity caveat above still routes through the calibration strip
   rather than being answered here. Suppressed when comparing branches (same
   "mud" reason the p75–p90 band is) and on soak charts, whose x-axis is minutes
   within one run.

   Drift is computed over **all** history for the selected branches, never the
   range-filtered view: its windows are defined in runs, so feeding it a 30-day
   slice would make the verdict a function of the range picker.

4. **Layer toggles** — the chart legend doubles as a switchboard: clicking an
   entry shows/hides that layer (median, p75–p90 band, baseline overlay) across
   the whole grid, persisted as `?layers=-band` so a stripped-back view is
   shareable. Global rather than per-card because the grid is 40+ small
   multiples.

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
