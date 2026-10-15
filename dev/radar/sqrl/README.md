# SQRL

SQRL (Studio Quality: Reliability & Latency) is one score for Studio quality, recorded for every `main` commit the nightly bench measures. Higher is better, and 100 is the late-June 2026 reference: the median of the first 7 commits Radar measured, 28 June to 18 July. The score has no ceiling and no targets, so it can keep climbing.

## How to read it

- 110 means Studio is about 10% better than the reference on balance across everything SQRL measures. 90 means about 10% worse.
- The headline is the median of the last 7 measured commits. A week-to-week move under about 7 points is within noise.
- The score is adjusted for CI machine speed, since a faster runner makes every timing look better. The unadjusted score is shown next to it in the banner.
- An input whose last 7 commits are worse than the 21 before them shows in red. The score has no lock, so a regression can sit under a rising headline, and the red list is where it shows.

## What goes into it

Each input is a lab measurement where lower is better. It counts as its value in the reference window divided by its value today, so any input getting faster, lighter or less frequent raises the score. The inputs are grouped into six pillars:

| Pillar          | Weight | Inputs                                                                                               |
| --------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| INP             | 35%    | article INP, singleString INP                                                                        |
| Responsiveness  | 13%    | keystroke latency, median and p75                                                                    |
| Load            | 13%    | time to editable (cold and warm), tool visible, login clickable, FCP, LCP, main-thread blocking, CLS |
| CPU & rendering | 13%    | script and task CPU, CPU and React commits after the page settles                                    |
| Memory & weight | 13%    | heap, DOM nodes, event listeners, boot JS, total JS, page CSS, soak heap growth, request count       |
| Reliability     | 13%    | npm-deprecated releases and hot-patches published within 72 hours of a minor, over the last 13 weeks |

SQRL only counts outcomes a user feels or pays for. Migration progress such as styled-components files removed is left out, so a migration only moves the score when it makes Studio faster or lighter. Production telemetry from real users is also left out, since Radar runs against a mocked API.

## Where it lives

- The banner at the top of Trends on [radar.sanity.dev](https://radar.sanity.dev) shows the score, its graph, the pillar scores and any regressed inputs.
- Each score is a `sqrlScore` document in the Radar dataset, written by the `sqrl-score` job in `.github/workflows/bench.yml` after each stored `main` run.
- `pnpm --filter radar sqrl -- --dry-run` prints the latest score from the live data without writing anything.

## Changing the formula

The formula, its frozen constants and the host adjustment are in `dev/radar/SPEC.md` under "SQRL score". Any change to an input, a weight or a constant bumps `FORMULA_VERSION` in `inputs.ts`, and a backfill run then rewrites every stored score, so the history always uses one formula.
