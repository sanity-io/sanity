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
  principle. What the score is (a fixed unthrottled CPU workload in the
  browser) is spelled out once (`CALIBRATION_EXPLAINER`) and reused by every
  surface that mentions it: chart ⓘ, legend entry, tooltip, run popover.
- Runs also record **host metadata** (`runner.os/arch/cpus/memGb/nodeVersion`,
  and from Aug 2026 `cpuModel`, `imageOs`/`imageVersion`, `browserVersion`;
  `cpuModel` also per-scenario shard). The run popover shows it as a Host
  section. `cpuModel` is the field that discriminates hosted-runner hardware
  generations (GitHub rotates CPU models under the same vCPU shape — cpus and
  memGb stayed identical across the Aug 2026 host-speed step), and
  `browserVersion` records the measuring instrument, since a Playwright bump
  moves INP/vitals with no studio change.
- PR A/B runs are _not_ stored (by design). The dashboard is main-branch
  health; PR verdicts live in PR comments.
- **Git history as data.** One `gitCommit` document per main-branch commit
  and one `gitTag` document per `v*` release tag, coverage starting at
  v5.0.0.

  Commit documents are metadata only: sha, first-parent sha (the exact
  mainline chain — `committedAt` ordering has tie/rebase hazards), author,
  dates, subject, and a best-effort conventional-commit parse plus PR
  number. Tag documents carry the dereferenced sha, a weak reference to
  their commit, and parsed semver so interleaved release lines group by
  major. Tags also carry npm data (`publishedAt`, `distTags`,
  `weeklyDownloads`), collected on releases, the daily cron, and dispatches
  — the cron is the floor because dist-tags re-point and download counts
  roll without commits.

  Sync (scripts/syncGitHistory.ts via sync-git-metrics.yml): every push to
  main re-upserts the last 50 commits — deterministic ids + createOrReplace
  make that stateless and self-healing; a larger gap takes one `backfill`
  dispatch. Documents are replaced whole, so a run never writes what it
  could not collect: an API error aborts before anything is written (the
  workflow alerts Slack; re-running is always safe), and tags are written
  only on npm-collecting runs.

  This is the join surface for future health metrics; joins are by value
  (`sha`, `committedAt`, `tag`). Two enrichments exist today: `benchRun`
  documents carry `git.commit`, a weak reference to their commit (written by
  perf/bench's storeShape.ts, backfilled once via the `patch_bench_run_refs`
  dispatch; dangles for PR-branch runs, `git.sha` stays the source of
  truth), and each `gitCommit` records `testStudioUrl`, the immutable Vercel
  deploy of dev/test-studio built at that commit — collected from GitHub
  deployment statuses, landing one sync late since the Vercel build outlives
  the sync run.

## Views

1. **Trends** — the first tool and the studio's default view. Small-multiples
   grid, one chart per scenario·metric (keystroke latency medians,
   time-to-editable, bundle initial JS, auth trips/in-flight), x = run date,
   line = p50, shaded band = p75–p90; clicking anywhere in the plot opens the
   nearest run's document (the run under the crosshair is marked on hover /
   keyboard focus — there are no resting dots, which at 30–90 runs in a small
   multiple were mostly ink).
   Time range picker (30/90/all). Every ms-based chart also draws **host
   calibration as an in-chart context line** (dotted, muted, its own
   zero-based scale so relative moves compare at the same visual proportion —
   dots always mean host calibration, dashes always mean a baseline level),
   using the shard score of the host that measured _that_ scenario — so "did
   the host spike where the metric spiked?" is answerable without switching
   tabs. The full unmerged per-shard strip lives in the Calibration tab.
   Suppressed on non-time metrics (counts/bytes/CLS don't move with a slow
   host) and when comparing branches.
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
   commit fairly often — 4 shas in the stored history have 2–3 runs each.
   Unmerged, that stacked several dots on one x-position, gave the commit
   several votes in every median, and made a "21 runs" window cover fewer than
   21 commits of history. (The merge also collapses duplicates of one metric
   within a single document, defensively — none are known to exist.)

   Median rather than mean, matching the p50 language used throughout: one
   throttled or failed re-run can't drag the point. The merged point keeps a real
   run's identity so click-through opens an actual document.

   Honesty cost, stated plainly: re-runs of one commit often land on hosts of
   different speed (sha `7147d045`'s two runs differ by 21% of calibration), so a
   merged point averages across hosts. The **calibration strip is deliberately
   not merged** — showing per-run and cross-shard host spread is its whole job.

   A second, faster **step** baseline (latest run vs a median of recent runs,
   to catch a jump the day it lands) was considered and rejected: measured
   against the stored history it would fire on 74–92% of runs at every window
   size, because run-to-run noise (~12% median) is well over the 5% threshold.
   Two baselines would also be impossible to tell apart in the UI while one of
   them fired constantly. Catching a single-run jump needs a more precise
   measurement (more sessions per run), not different arithmetic.

   A weekday-matched variant (compare against the last 4 runs on the _same
   weekday_, to control for day-of-week CI runner load) was rejected too: the
   stored history does not support it — weekday and weekend `calibrationMs`
   medians are identical (7.60 vs 7.60) and only ~14% of calibration variance
   sits between weekdays. Host speed is handled by the per-run
   `runner.calibrationMs` measurement instead.

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
   entry shows/hides that layer (median, p75–p90 band, host calibration,
   baseline overlay, release markers) across the whole grid, persisted as
   `?layers=-band` so a stripped-back view is shareable. Global rather than
   per-card because the grid is 40+ small multiples.

5. **Release markers** — one dotted vertical rule per stable `v*` tag
   (`gitTag`, rc tags excluded) inside the plotted window, so "did this step
   land with a release?" is answerable without leaving the chart. The first
   consumer of the git-history join surface.

   **Main-branch releases only.** The charts only ever plot main (bench runs are
   main-branch crons), so a release cut off main is a _false_ annotation — its
   commits are not in the line being measured. `TAGS_QUERY` filters on the
   existence of a `gitCommit` with the tag's sha, since those documents are
   main-only by construction. This is not a filter on `major`: the v5 tags up to
   the v6 cutover were cut from main and belong on a chart reaching back that
   far, while v5.31.2 (a maintenance release that shipped mid-window from a
   release branch) is correctly excluded. The tag's own weak `commit` reference
   is deliberately not the test — a dangling weak ref means "not synced", which
   is a different claim than "not on main".

   **Markers anchor to release runs where they exist** (`resolveTagPositions`).
   A run with `trigger: 'release'` built and measured the tagged commit, so its
   point _is_ the release and the marker sits exactly on it. The two positions
   genuinely differ — the tag date is when the release was cut, the run measured
   it whenever CI got to it — so drawing on the tag date would put the rule
   beside the point that measured it.

   Releases with no run fall back to the tag's own date, which is what every
   marker did before release runs existed. Both kinds render **identically**:
   the distinction is carried by wording (the tooltip says "measured release"
   vs "release"; the popover says "released as" vs an after/before bracket), not
   by a second visual language that would need its own legend entry to explain a
   difference only relevant once you are asking about a specific run. So a chart
   mixes anchored and date-placed markers without looking inconsistent — which
   it will for as long as history predating release runs is in range.

   Why this matters: before release runs, **1 of the first 9 releases** in the
   bench window had ever been benchmarked, and that one was a coincidence (a
   cron happened to land on it). Every performance statement about a release was
   an interpolation between commits nobody shipped. See `perf/bench`'s
   `bench-release` job in `release-latest.yml`.

   The fallback join is **by time**, not by sha, and stays deliberately hedged:
   an unanchored marker claims only "this release shipped here", never "this run
   measured this release".

   The **run popover** states release context for every run. A release run says
   "released as vX.Y.Z" — the one case where a number attributes to a shipped
   version. Every other run gets the bracket (`releaseContextAt`): newest
   release at or before it, and the next one after ("after v6.10.1 / not yet
   released"). The bracket reads the full tag list rather than the visible
   window, since a run's preceding release is often older than the plotted
   range. It stays a by-date bound, hence "after"/"before" rather than "released
   in": proving commit containment would need an ancestry walk over
   `gitCommit.parentSha`.

   Markers survive branch comparison, unlike the band and the baseline overlay:
   a release is global context, identical for every line, so it cannot turn
   into per-branch mud. They are suppressed only on soak latest-run charts,
   whose x-axis is minutes within one run — a calendar-dated rule there would
   claim a relationship between a release and a minute of runtime.

   **Labels are size-dependent.** At grid-card width (~330px) a 90-day window
   holds ~20 markers, one every ~15px, so resting text is guaranteed overlap:
   cards draw unlabelled rules (each with a tick at the top so it still reads as
   an anchor) and the hover tooltip names the release nearest the crosshair,
   within half the median run gap. The maximized view has the room and draws
   rotated labels, thinned so that a cluster keeps its last tag — releases
   cluster on release days, and the last of a cluster is the one in effect for
   the runs that follow.

6. **Maximize a single chart** — the grid is built for scanning; reading one
   chart closely needs room. An expand button on each card opens the same
   `SeriesCard` in a dialog at `?max=<series key>` (shareable and reloadable,
   pushed to history so Back closes it), where it draws labelled release
   markers and shows its description as visible text instead of behind the ⓘ.
   The dialog is a superset of the card: it gets the same drift, baseline and
   ack props, so maximizing is never a downgrade. Fixed width rather than
   full-viewport — stretching 90 days across a 2500px monitor reads as a flat
   line no matter what the metric did.

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
  sparse/single/empty sets, plus synthetic release tags with two interleaved
  majors and a deliberate label collision) selectable in the toolbar, so the
  charts, the drift feed and every encoding layer are testable without live
  data.
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
  (coverage reports from CI's `json-summary`, flake rates, version stability,
  error rates) as sibling document types with their own trends tabs — the
  `gitCommit`/`gitTag` documents (landed Aug 2026) are the join surface these
  build on. Release markers (above) are the first consumer, shipped; commit
  subjects in the run popover are the obvious next one.
