---
name: sanity-radar
description: Studio Radar, the repo-health dashboard at radar.sanity.dev (source in dev/radar) — what each tool shows, where the data lives, how to query benchRun / gitCommit / gitTag / bisectSession documents with GROQ (read token required), and how to run, test and change the dashboard code. Use when asked about studio performance trends, drift flags, the bench dataset, release markers, the Bisect or Comparisons tools, "what did the daily bench say", or when editing anything under dev/radar.
---

# Studio Radar

Radar answers repo-health questions without opening CI logs: is studio performance drifting on
main, what did a run look like, which commit broke it, what shipped when. It is a Sanity Studio
(`dev/radar`, deployed at https://radar.sanity.dev) reading a dataset that CI writes. The design
record is `dev/radar/SPEC.md` — read the section for the view you touch, and update it when
behavior changes. For regression hunting use `sanity-radar-investigate`; for producing the data
use `sanity-bench`.

## Tools (URL path = tool name)

| Tool        | Path           | Shows                                                                                                                                                                              |
| ----------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trends      | `/trends`      | Small multiples per scenario·metric on main: p50 line, p75–p90 band, host calibration (dotted), drift baseline overlay (dashed before / solid after), release ticks. Default view. |
| Releases    | `/releases`    | Every synced `v*` tag: dist-tags, downloads, changelog links, regressions bisect attributed to it.                                                                                 |
| Bisect      | `/bisect`      | Guided first-parent bisect over `gitCommit` using each commit's test-studio preview build.                                                                                         |
| Diagnostics | `/diagnostics` | Paste a studio diagnostics JSON, render it (in-studio twin of `dev/studio-diagnostics-viewer`).                                                                                    |
| Structure   | `/structure`   | Raw documents.                                                                                                                                                                     |
| Comparisons | `/comparisons` | Stored `mode: "ab"` runs from A/B dispatches, verdict per metric.                                                                                                                  |

Trends URL state, all shareable: `?range=30|90|all`, `?branches=main,<branch>`,
`?layers=-band,-calibration` (hide layers), `?tab=<metric group>`, `?max=<series key>` (one chart maximized).
Clicking a point opens the run popover: value, percentiles, host, release context, links, and
under "Suspect a regression?" the GitHub compare of the gap, **Copy A/B vs previous run** (the
`gh workflow run bench.yml … ab_from/ab_to` command) and **Copy investigation prompt** (a
paste-ready brief for an agent).

## The data

Project `mhfozd0z`, dataset `bench`, **private**: reads need a token with access to the project
(your CLI token via `sanity debug --secrets`, or a viewer token from sanity.io/manage; the deployed
studio authenticates through your login). Writes need `RADAR_SANITY_WRITE_TOKEN`, which only CI
has; never write from a laptop. Ids are built in one place, `@repo/utils/radar-ids`: lowercase,
dashes, no dots (a dot makes an id a path like `drafts.x`, which the API scopes differently).

| Type            | Written by                                     | Id                                              | Key fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `benchRun`      | `bench store` in `.github/workflows/bench.yml` | `bench-run-<sha>-<run id>` / `bench-run-pr-<n>` | `mode` (`absolute` = time-series point, `ab` = investigation record), `trigger` (`cron`/`release`/`backfill`/`dispatch`/`pr`; absent = cron), `git{sha, branch, committedAt, mergeBaseSha, prNumber}`, `runner{calibrationMs, cpuModel, runId…}`, `scenarios[]{scenario, mode, runner{calibrationMs, cpuModel}, metrics[]{label, unit, experiment/reference{summary{median,p75,p90}}, comparison{diff,lo,hi,verdict}}, resources, soak}`, `bundle{initialJsBytes, totalJsBytes}` |
| `gitCommit`     | `sync-git-metrics.yml` (every push to main)    | `git-commit-<sha>`                              | `sha`, `parentSha` (first-parent chain), `committedAt`, `subject`, `prNumber`, author, `testStudioUrl`                                                                                                                                                                                                                                                                                                                                                                           |
| `gitTag`        | same, releases and a daily npm floor           | `git-tag-v6-10-1`                               | `tag`, `sha`, `taggedAt`, `major/minor/patch/prerelease`, `npm{distTags, weeklyDownloads, publishedAt}`                                                                                                                                                                                                                                                                                                                                                                          |
| `bisectSession` | Bisect tool (user-owned, liveEdit)             | `bisect-session-<uuid>`                         | `good/bad{sha}`, `marks[]`, `result{firstBadSha, suspectShas, regression}`                                                                                                                                                                                                                                                                                                                                                                                                       |
| `driftAck`      | Trends drift feed (user-owned)                 | `drift-ack-<slug of metricKey:branch>`          | `state` (`silenced`/`snoozed`/`fixed`), `baselineValue`, `until`                                                                                                                                                                                                                                                                                                                                                                                                                 |

Rules that every consumer follows (the dashboard's queries are the reference, `tools/*/data.ts`):

- **Project, never fetch `sessions`.** Documents carry per-session sample arrays; a bare `*[_type == "benchRun"]` is megabytes.
- **Time series = `mode == "absolute"`**, ordered by `coalesce(git.committedAt, startedAt)` (backfill runs have a historical `committedAt` and a recent `startedAt`). PR-branch runs share the type — filter `git.branch == "main"` for the main line.
- **Same-sha runs are one point.** CI re-measures commits; the charts merge them by median.
- **Absolute numbers are host-relative.** Always read `runner.calibrationMs` (higher = slower host) and `runner.cpuModel` next to any value; only A/B `comparison.verdict`s are host-independent.
- `git.sha` is the join key to `gitCommit`; `benchRun.git.commit` is a weak reference that dangles for PR-branch runs.

Ready-made queries: [references/groq-recipes.md](references/groq-recipes.md).

## Working on the dashboard

```bash
pnpm radar                                  # sanity dev on http://localhost:3399 (needs a Sanity login; reads live data)
pnpm vitest run --project=radar             # pure modules: trend math, drift, bisect, git parsers
pnpm build:radar                            # production build (turbo)
pnpm --filter radar sync-git -- --dry-run   # preview the git-history sync (needs GITHUB_TOKEN)
```

- **Realtime everywhere**: `useDocumentStore().listenQuery` + `useObservable`, never one-shot `client.fetch`. New cron runs must appear without a reload.
- **Charts are visx primitives** (`@visx/scale|shape|group|axis|responsive`) inside `@sanity/ui` layout; no chart library.
- **Debug data sources** (dev server only, toolbar picker; `tools/trends/debugData.ts`) render steady/drift/step/host-correlated/sparse/empty datasets and synthetic release tags — use them to exercise every encoding layer and the drift feed without live data. UI is verified through these, not unit tests.
- **One source of truth for "enough to care"**: drift thresholds import from `perf/bench/stats/gate.ts`. Don't invent a second statistic; SPEC.md records the baselines that were tried and rejected (step, weekday-matched) and why.
- Honesty constraint: any surface showing a ms value must make host calibration visible (`CALIBRATION_EXPLAINER` is the one shared wording).
- Studio conventions from `AGENTS.md` apply (no `forwardRef`, `use-effect-event`, no inline Translate components).

## Operations

- Daily main run: `bench.yml` cron 05:00 UTC; git sync 05:30. A missed day is repaired with a backfill dispatch (see `sanity-bench`). A gap in commits: `gh workflow run sync-git-metrics.yml -f backfill=true`.
- Release markers only appear for tags whose commit has a `gitCommit` document (main-only by construction); a maintenance release cut from a branch is correctly absent.
- Cron failures alert the CI Slack channel; a hole in the series with no alert means the store step was skipped, not that the run failed.
